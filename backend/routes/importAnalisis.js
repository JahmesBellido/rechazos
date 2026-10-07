const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporciono archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'El archivo esta vacio' });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const motivo = row.motivo_anulacion || row.motivo || row.Motivo || row.MOTIVO || row["Motivo Anulacion"] || row["MOTIVO ANULACION"] || null;
        const importeRaw = row.importe || row.Importe || row.IMPORTE || row["Importe (S/)"] || 0;
        const cantRaw = row.cant_analisis || row.cant || row.Cant || row.CANT || row.cantidad || row.Cantidad || row["Cantidad Documentos"] || row["CANTIDAD DOCUMENTOS"] || 0;
        const fechaRaw = row.fecha_analisis || row.fecha || row.Fecha || row.FECHA || row["Fecha Analisis"] || row["FECHA ANALISIS"] || null;
        const cajasRaw = row.cajas_motivo || row.cajas || row.Cajas || row.CAJAS || row["Cajas Motivo"] || row["CAJAS MOTIVO"] || 0;
        const unidadesRaw = row.unidades_motivo || row.unidades || row.Unidades || row.UNIDADES || row["Unidades Motivo"] || row["UNIDADES MOTIVO"] || 0;
        const cantMotivoRaw = row.cantidad_motivo || row.Cantidad_Motivo || row["cantidad motivo"] || row["Cantidad Motivo"] || row["CANTIDAD MOTIVO"] || 0;

        if (!motivo) {
          skipped++;
          errors.push(`Fila ${i + 2}: Motivo de anulacion vacio`);
          continue;
        }

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

        if (!fecha) {
          skipped++;
          errors.push(`Fila ${i + 2}: Fecha vacia`);
          continue;
        }

        const importeNum = Number(importeRaw) || 0;
        const cantNum = Number(cantRaw) || 0;
        const cajasNum = Number(cajasRaw) || 0;
        const unidadesNum = Number(unidadesRaw) || 0;
        const cantMotivoNum = Number(cantMotivoRaw) || 0;

        await pool.query(
          `INSERT INTO analisis (motivo_anulacion, importe, cant_analisis, fecha_analisis, cajas_motivo, unidades_motivo, cantidad_motivo)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [motivo, importeNum, cantNum, fecha, cajasNum, unidadesNum, cantMotivoNum]
        );
        inserted++;
      } catch (err) {
        skipped++;
        errors.push(`Fila ${i + 2}: ${err.message}`);
      }
    }

    res.json({
      message: `Insertados: ${inserted}, Omitidos: ${skipped}`,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Error al importar analisis:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
