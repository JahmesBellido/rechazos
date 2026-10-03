const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');
const Rechazo = require('../models/Rechazo');
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
    let totalCajas = 0;
    let totalUnidades = 0;
    const errors = [];

    for (const row of rows) {
      const codigo = row.codigo_identificador || row.codigo || row.Codigo || row.CODIGO;
      if (!codigo) {
        skipped++;
        continue;
      }

      if (inserted === 0 && updated === 0) {
        console.log('Columnas Excel:', Object.keys(row));
      }

      const cantRechazada = row.cantidad_rechazada || row.rechazada || row.Rechazada || row.RECHAZADA || null;
      const cantRechazados = row.cant_documentos_rechazados || row["cant rechazados"] || row.CantRechazados || row.CANT_RECHAZADOS || null;
      const cajasFisicas = row.cajas_fisicas || row.cajas || row.Cajas || row.CAJAS || row["Cajas Fisicas"] || row["cajas fisicas"] || row.CAJAS_FISICAS || null;
      const unidadesFisicas = row.unidades_fisicas || row.unidades || row.Unidades || row.UNIDADES || row["Unidades Fisicas"] || row["unidades fisicas"] || row.UNIDADES_FISICAS || null;
      const fechaRaw = row.fecha_rechazo || row.fecha || row.Fecha || row.FECHA || null;

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
        const cantRechazadaNum = cantRechazada ? Number(cantRechazada) : 0;
        const cantRechazadosNum = cantRechazados ? Number(cantRechazados) : 0;
        const cajasFisicasNum = cajasFisicas ? Number(cajasFisicas) : 0;
        const unidadesFisicasNum = unidadesFisicas ? Number(unidadesFisicas) : 0;

        totalCajas += cajasFisicasNum;
        totalUnidades += unidadesFisicasNum;

        const [existing] = await pool.query(
          'SELECT id FROM rechazos WHERE codigo_identificador = ? AND ((fecha_rechazo = ?) OR (fecha_rechazo IS NULL AND ? IS NULL))',
          [codTrim, fecha, fecha]
        );

        if (existing.length > 0) {
          const id = existing[0].id;
          const total_rechazo = cantRechazadaNum * 1.02;
          const [docRow] = await pool.query(
            'SELECT COALESCE(SUM(cant_documentos), 0) AS total_docs, COALESCE(SUM(liquidacion_total_diaria), 0) AS total_liq FROM documentos WHERE codigo_identificador = ? AND fecha_documentos = ?',
            [codTrim, fecha]
          );
          const totalDocs = docRow[0].total_docs;
          const totalLiq = docRow[0].total_liq;
          const documentos_finales = totalDocs - cantRechazadosNum;
          const liquidacion_final = totalLiq - total_rechazo;

          await pool.query(
            'UPDATE rechazos SET cantidad_rechazada = ?, cant_documentos_rechazados = ?, cajas_fisicas = ?, unidades_fisicas = ?, total_rechazo = ?, documentos_finales = ?, liquidacion_final = ? WHERE id = ?',
            [cantRechazadaNum, cantRechazadosNum, cajasFisicasNum, unidadesFisicasNum, total_rechazo, documentos_finales, liquidacion_final, id]
          );
          updated++;
        } else {
          await Rechazo.create({
            codigo_identificador: codTrim,
            cantidad_rechazada: cantRechazadaNum,
            cant_documentos_rechazados: cantRechazadosNum,
            cajas_fisicas: cajasFisicasNum,
            unidades_fisicas: unidadesFisicasNum,
            fecha_rechazo: fecha
          });
          inserted++;
        }
      } catch (err) {
        skipped++;
        errors.push(`Fila: ${codigo} - ${err.message}`);
      }
    }

    res.json({
      message: `Insertados: ${inserted}, Actualizados: ${updated}, Omitidos: ${skipped}`,
      cajas: totalCajas,
      unidades: totalUnidades,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Error al importar rechazos:', error);
    res.status(500).json({ message: 'Error al procesar el archivo' });
  }
});

module.exports = router;
