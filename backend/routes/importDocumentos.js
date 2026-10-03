const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');
const Documento = require('../models/Documento');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío' });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      const codigo = row.codigo_identificador || row.codigo || row.Codigo || row.CODIGO;
      if (!codigo) {
        skipped++;
        continue;
      }

      const carga = row.carga || row.Carga || row.CARGA || null;
      const liq = row.liquidacion_programada || row.liquidacion || row.Liquidacion || row.LIQUIDACION || null;
      const cant = row.cant_documentos || row["cant doc"] || row.CantDocumentos || row.CANT_DOCUMENTOS || null;
      const cargasProg = row.cargas_programadas || row.cajas_programadas || row["cargas prog"] || row["cajas prog"] || row.CargasProgramadas || row.CajasProgramadas || row.CARGAS_PROGRAMADAS || row.CAJAS_PROGRAMADAS || null;
      const unidadesProg = row.unidades_programadas || row["unidades prog"] || row.UnidadesProgramadas || row.UNIDADES_PROGRAMADAS || null;
      const fechaRaw = row.fecha_documentos || row.fecha || row.Fecha || row.FECHA || null;

      let fecha = null;
      if (fechaRaw) {
        if (typeof fechaRaw === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const d = new Date(excelEpoch.getTime() + fechaRaw * 86400000);
          fecha = d.toISOString().split('T')[0];
        } else {
          const str = String(fechaRaw).split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            fecha = str;
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
            const [dd, mm, yyyy] = str.split('/');
            fecha = `${yyyy}-${mm}-${dd}`;
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
            const [dd, mm, yyyy] = str.split('-');
            fecha = `${yyyy}-${mm}-${dd}`;
          } else {
            fecha = str;
          }
        }
      }

      try {
        const codTrim = String(codigo).trim();
        const liqNum = liq ? Number(liq) : null;
        const cantNum = cant ? Number(cant) : null;
        const cargasProgNum = cargasProg ? Number(cargasProg) : null;
        const unidadesProgNum = unidadesProg ? Number(unidadesProg) : null;

        const [existing] = await pool.query(
          'SELECT id FROM documentos WHERE codigo_identificador = ? AND ((carga = ?) OR (carga IS NULL AND ? IS NULL)) AND ((fecha_documentos = ?) OR (fecha_documentos IS NULL AND ? IS NULL))',
          [codTrim, carga, carga, fecha, fecha]
        );

        if (existing.length > 0) {
          await pool.query(
            'UPDATE documentos SET liquidacion_programada = ?, cant_documentos = ?, cargas_programadas = ?, unidades_programadas = ? WHERE id = ?',
            [liqNum, cantNum, cargasProgNum, unidadesProgNum, existing[0].id]
          );
          await Documento.syncLiquidacionTotal(codTrim, fecha);
          await Documento.syncRechazos(codTrim, fecha);
          updated++;
        } else {
          await Documento.create({
            codigo_identificador: codTrim,
            carga: carga,
            liquidacion_programada: liqNum,
            cant_documentos: cantNum,
            cargas_programadas: cargasProgNum,
            unidades_programadas: unidadesProgNum,
            fecha_documentos: fecha
          });
          inserted++;
        }
      } catch (err) {
        skipped++;
        errors.push(`Fila: ${codigo} - ${err.message}`);
      }
    }

    res.json({ message: `Insertados: ${inserted}, Actualizados: ${updated}, Omitidos: ${skipped}`, errors: errors.slice(0, 10) });
  } catch (error) {
    console.error('Error al importar:', error);
    res.status(500).json({ message: 'Error al procesar el archivo' });
  }
});

module.exports = router;
