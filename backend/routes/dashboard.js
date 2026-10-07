const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const ExcelJS = require('exceljs');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/summary', isAuthenticated, async (req, res) => {
  try {
    const [liqTotal] = await pool.query(
      'SELECT COALESCE(SUM(liquidacion_total_diaria), 0) AS total FROM documentos'
    );
    const [rechazosTotal] = await pool.query(
      `SELECT COALESCE(SUM(total_rechazo), 0) AS total,
              COALESCE(SUM(cant_documentos_rechazados), 0) AS docs,
              COALESCE(SUM(cajas_fisicas), 0) AS total_cajas,
              COALESCE(SUM(unidades_fisicas), 0) AS total_unidades
       FROM rechazos`
    );
    const [docsCount] = await pool.query('SELECT COUNT(*) AS total FROM documentos');
    const [rechCount] = await pool.query('SELECT COUNT(*) AS total FROM rechazos');
    const [transCount] = await pool.query('SELECT COUNT(*) AS total FROM transportistas');

    const [liqSemanal] = await pool.query(
      `SELECT COALESCE(SUM(liquidacion_total_diaria), 0) AS total
       FROM documentos
       WHERE fecha_documentos >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND fecha_documentos <= CURDATE()`
    );
    const [rechSemanal] = await pool.query(
      `SELECT COALESCE(SUM(total_rechazo), 0) AS total
       FROM rechazos
       WHERE fecha_rechazo >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND fecha_rechazo <= CURDATE()`
    );

    const liquidacionFinal = Number(liqTotal[0].total) - Number(rechazosTotal[0].total);
    const liqSemanalNum = Number(liqSemanal[0].total);
    const rechSemanalNum = Number(rechSemanal[0].total);
    const liqSemanalNeta = liqSemanalNum - rechSemanalNum;
    const pctSemanal = liqSemanalNum > 0 ? ((rechSemanalNum / liqSemanalNum) * 100).toFixed(1) : '0.0';

    res.json({
      liquidacionTotal: Number(liqTotal[0].total),
      totalRechazado: Number(rechazosTotal[0].total),
      documentosRechazados: Number(rechazosTotal[0].docs),
      totalCajas: Number(rechazosTotal[0].total_cajas),
      totalUnidades: Number(rechazosTotal[0].total_unidades),
      liquidacionFinal,
      liqSemanal: liqSemanalNeta,
      pctSemanal,
      totalDocumentos: docsCount[0].total,
      totalRechazos: rechCount[0].total,
      totalTransportistas: transCount[0].total
    });
  } catch (error) {
    console.error('Error en summary:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/diario', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fecha_documentos AS fecha,
              COALESCE(SUM(liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(SUM(cant_documentos), 0) AS total_docs
       FROM documentos
       WHERE fecha_documentos IS NOT NULL
       GROUP BY fecha_documentos
       ORDER BY fecha_documentos DESC
       LIMIT 30`
    );
    res.json({ data: rows.reverse() });
  } catch (error) {
    console.error('Error en diario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/rechazos-diario', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.fecha_rechazo AS fecha,
              COALESCE(SUM(r.total_rechazo), 0) AS total_rechazo,
              COALESCE(SUM(r.cant_documentos_rechazados), 0) AS docs_rechazados,
              COALESCE(SUM(r.liquidacion_final), 0) AS liq_final,
              COALESCE(SUM(r.cajas_fisicas), 0) AS cajas_fisicas,
              COALESCE(SUM(d.cargas_programadas), 0) AS cargas_programadas,
              CASE
                WHEN COALESCE(SUM(d.cargas_programadas), 0) = 0 THEN 0
                ELSE ROUND(COALESCE(SUM(r.cajas_fisicas), 0) * 100.0 / SUM(d.cargas_programadas), 2)
              END AS porcentaje_cajas
       FROM rechazos r
       LEFT JOIN (
         SELECT fecha_documentos, SUM(cargas_programadas) AS cargas_programadas
         FROM documentos
         GROUP BY fecha_documentos
       ) d ON r.fecha_rechazo = d.fecha_documentos
       WHERE r.fecha_rechazo IS NOT NULL
       GROUP BY r.fecha_rechazo
       ORDER BY r.fecha_rechazo DESC
       LIMIT 30`
    );
    res.json({ data: rows.reverse() });
  } catch (error) {
    console.error('Error en rechazos-diario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/por-transportista', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(r2.total_rechazo, 0) AS total_rechazo,
              COALESCE(r2.cant_documentos_rechazados, 0) AS docs_rechazados
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       LEFT JOIN (
         SELECT codigo_identificador,
                SUM(total_rechazo) AS total_rechazo,
                SUM(cant_documentos_rechazados) AS cant_documentos_rechazados
         FROM rechazos
         GROUP BY codigo_identificador
       ) r2 ON d.codigo_identificador = r2.codigo_identificador
       GROUP BY d.codigo_identificador, t.nombres, t.apellidos, r2.total_rechazo, r2.cant_documentos_rechazados
       ORDER BY total_liq DESC
       LIMIT 10`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('Error en por-transportista:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/por-carga', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COALESCE(carga, 'Sin carga') AS carga,
              COALESCE(SUM(liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(SUM(cant_documentos), 0) AS total_docs
       FROM documentos
       GROUP BY carga
       ORDER BY total_liq DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('Error en por-carga:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

const getFechaLocal = (diasOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/home-rechazos', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);

    const [transportistas] = await pool.query(
      `SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(r2.total_rechazo, 0) AS total_rechazo,
              COALESCE(r2.cant_rechazados, 0) AS docs_rechazados,
              COALESCE(r2.total_cajas, 0) AS total_cajas,
              COALESCE(r2.total_unidades, 0) AS total_unidades,
              CASE
                WHEN COALESCE(SUM(d.liquidacion_total_diaria), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(r2.total_rechazo, 0) / SUM(d.liquidacion_total_diaria)) * 100, 2)
              END AS porcentaje_rechazo
         FROM documentos d
         LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
         LEFT JOIN (
           SELECT codigo_identificador,
                  SUM(total_rechazo) AS total_rechazo,
                  SUM(cant_documentos_rechazados) AS cant_rechazados,
                  SUM(cajas_fisicas) AS total_cajas,
                  SUM(unidades_fisicas) AS total_unidades
           FROM rechazos
           WHERE DATE(fecha_rechazo) = ?
           GROUP BY codigo_identificador
         ) r2 ON d.codigo_identificador = r2.codigo_identificador
         WHERE DATE(d.fecha_documentos) = ? AND COALESCE(r2.total_rechazo, 0) > 0
         GROUP BY d.codigo_identificador, t.nombres, t.apellidos, r2.total_rechazo, r2.cant_rechazados, r2.total_cajas, r2.total_unidades
         ORDER BY porcentaje_rechazo DESC`,
      [fecha, fecha]
    );

    const totalCajasDia = transportistas.reduce((s, t) => s + Number(t.total_cajas || 0), 0);
    const totalUnidadesDia = transportistas.reduce((s, t) => s + Number(t.total_unidades || 0), 0);

    const [progRow] = await pool.query(
      `SELECT COALESCE(SUM(cargas_programadas), 0) AS total_cargas_prog,
              COALESCE(SUM(unidades_programadas), 0) AS total_unidades_prog
       FROM documentos
       WHERE DATE(fecha_documentos) = ?`,
      [fecha]
    );
    const totalCargasProgramadas = Number(progRow[0].total_cargas_prog);
    const totalUnidadesProgramadas = Number(progRow[0].total_unidades_prog);

    const [liquidacionDiaria] = await pool.query(
      `SELECT d.fecha_documentos AS fecha,
              d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(r2.total_rechazo, 0) AS total_rechazo,
              COALESCE(r2.cant_rechazados, 0) AS docs_rechazados,
              COALESCE(r2.total_cajas, 0) AS total_cajas,
              COALESCE(r2.total_unidades, 0) AS total_unidades,
              CASE
                WHEN COALESCE(SUM(d.liquidacion_total_diaria), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(r2.total_rechazo, 0) / SUM(d.liquidacion_total_diaria)) * 100, 2)
              END AS porcentaje_rechazo
         FROM documentos d
         LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
         LEFT JOIN (
           SELECT codigo_identificador, fecha_rechazo,
                  SUM(total_rechazo) AS total_rechazo,
                  SUM(cant_documentos_rechazados) AS cant_rechazados,
                  SUM(cajas_fisicas) AS total_cajas,
                  SUM(unidades_fisicas) AS total_unidades
           FROM rechazos
           WHERE DATE(fecha_rechazo) = ?
           GROUP BY codigo_identificador, fecha_rechazo
         ) r2 ON d.codigo_identificador = r2.codigo_identificador AND DATE(d.fecha_documentos) = DATE(r2.fecha_rechazo)
         WHERE DATE(d.fecha_documentos) = ? AND COALESCE(r2.total_rechazo, 0) > 0
         GROUP BY d.fecha_documentos, d.codigo_identificador, t.nombres, t.apellidos, r2.total_rechazo, r2.cant_rechazados, r2.total_cajas, r2.total_unidades
         ORDER BY porcentaje_rechazo DESC`,
      [fecha, fecha]
    );

    res.json({ transportistas, liquidacionDiaria, fecha, totalCajasDia, totalUnidadesDia, totalCargasProgramadas, totalUnidadesProgramadas });
  } catch (error) {
    console.error('Error en home-rechazos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/export-excel', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);
    const parts = fecha.split('-');
    const fechaFmt = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const sqlTransportistas = (condRechazo) => `
      SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.liquidacion_total_diaria), 0) AS total_liq,
              COALESCE(r2.total_rechazo, 0) AS total_rechazo,
              COALESCE(r2.cant_rechazados, 0) AS docs_rechazados,
              COALESCE(r2.total_cajas, 0) AS total_cajas,
              COALESCE(r2.total_unidades, 0) AS total_unidades,
              CASE
                WHEN COALESCE(SUM(d.liquidacion_total_diaria), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(r2.total_rechazo, 0) / SUM(d.liquidacion_total_diaria)) * 100, 2)
              END AS porcentaje_rechazo,
              CASE
                WHEN COALESCE(SUM(d.liquidacion_total_diaria), 0) = 0 THEN 0
                ELSE ROUND(SUM(d.liquidacion_total_diaria) - COALESCE(r2.total_rechazo, 0), 2)
              END AS liquidacion_neta
         FROM documentos d
         LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
         LEFT JOIN (
           SELECT codigo_identificador,
                  SUM(total_rechazo) AS total_rechazo,
                  SUM(cant_documentos_rechazados) AS cant_rechazados,
                  SUM(cajas_fisicas) AS total_cajas,
                  SUM(unidades_fisicas) AS total_unidades
           FROM rechazos
           WHERE DATE(fecha_rechazo) = ?
           GROUP BY codigo_identificador
         ) r2 ON d.codigo_identificador = r2.codigo_identificador
         WHERE DATE(d.fecha_documentos) = ? ${condRechazo}
         GROUP BY d.codigo_identificador, t.nombres, t.apellidos, r2.total_rechazo, r2.cant_rechazados, r2.total_cajas, r2.total_unidades
         ORDER BY porcentaje_rechazo DESC`;

    const [transportistas] = await pool.query(
      sqlTransportistas('AND COALESCE(r2.total_rechazo, 0) > 0'),
      [fecha, fecha]
    );

    // Incluye tambien los transportistas con cero rechazo del dia (hoja Resumen)
    const [transportistasResumen] = await pool.query(sqlTransportistas(''), [fecha, fecha]);

    const [docsDelDia] = await pool.query(
      `SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              d.carga,
              d.liquidacion_programada,
              d.cant_documentos,
              d.fecha_documentos,
              d.liquidacion_total_diaria
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       WHERE DATE(d.fecha_documentos) = ?
       ORDER BY d.codigo_identificador`,
      [fecha]
    );

    const [analisisDelDia] = await pool.query(
      `SELECT motivo_anulacion,
              cant_analisis,
              cajas_motivo,
              unidades_motivo,
              cantidad_motivo,
              importe,
              fecha_analisis
       FROM analisis
       WHERE DATE(fecha_analisis) = ?
       ORDER BY importe DESC`,
      [fecha]
    );

    const [rechazosDelDia] = await pool.query(
      `SELECT r.codigo_identificador,
              t.nombres, t.apellidos,
              r.cantidad_rechazada,
              r.total_rechazo,
              r.cant_documentos_rechazados,
              r.cajas_fisicas,
              r.unidades_fisicas,
              r.documentos_finales,
              r.liquidacion_final,
              r.fecha_rechazo
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       WHERE DATE(r.fecha_rechazo) = ?
       ORDER BY r.codigo_identificador`,
      [fecha]
    );

    const [cajasFisicas] = await pool.query(
      `SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.cargas_programadas), 0) AS cargas_programadas,
              COALESCE(SUM(d.unidades_programadas), 0) AS unidades_programadas,
              COALESCE(r.cajas_fisicas, 0) AS cajas_fisicas,
              COALESCE(r.unidades_fisicas, 0) AS unidades_fisicas,
              CASE
                WHEN COALESCE(SUM(d.cargas_programadas), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(r.cajas_fisicas, 0) / SUM(d.cargas_programadas)) * 100, 2)
              END AS porcentaje_cajas
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       LEFT JOIN (
         SELECT codigo_identificador,
                SUM(cajas_fisicas) AS cajas_fisicas,
                SUM(unidades_fisicas) AS unidades_fisicas
         FROM rechazos
         WHERE DATE(fecha_rechazo) = ?
         GROUP BY codigo_identificador
       ) r ON d.codigo_identificador = r.codigo_identificador
       WHERE DATE(d.fecha_documentos) = ?
       GROUP BY d.codigo_identificador, t.nombres, t.apellidos, r.cajas_fisicas, r.unidades_fisicas
       ORDER BY porcentaje_cajas DESC`,
      [fecha, fecha]
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Rechazos';
    wb.created = new Date();

    const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const titleFont = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    const subtitleFont = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } };
    const totalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    const totalFont = { bold: true, size: 11 };
    const criticoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    const altoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
    const moderadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
    const minimoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    const minimoFont = { bold: true, size: 11, color: { argb: 'FF15803D' } };
    const NIVEL_MINIMO = 'Rechazo minimo a 0.5%';
    const ceroFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBF7D0' } };
    const ceroFont = { bold: true, size: 11, color: { argb: 'FF166534' } };
    const NIVEL_CERO = 'Sin rechazo';
    constMoney = (val) => Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ========== HOJA 1: RESUMEN ==========
    const ws1 = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: 'FF1E3A5F' } } });
    ws1.columns = [
      { width: 22 }, { width: 25 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 26 }
    ];

    ws1.mergeCells('A1:J1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'REPORTE DIARIO DE RECHAZOS';
    titleCell.font = titleFont;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    ws1.getRow(1).height = 35;

    ws1.mergeCells('A2:J2');
    const dateCell = ws1.getCell('A2');
    dateCell.value = `Fecha: ${fechaFmt}`;
    dateCell.font = { bold: true, size: 12, color: { argb: 'FF6B7280' } };
    dateCell.alignment = { horizontal: 'center' };

    const totalLiq = transportistas.reduce((s, t) => s + Number(t.total_liq), 0);
    const totalRech = transportistas.reduce((s, t) => s + Number(t.total_rechazo), 0);
    const totalDocsRech = transportistas.reduce((s, t) => s + Number(t.docs_rechazados), 0);
    const totalNeta = totalLiq - totalRech;
    const pctGlobal = totalLiq > 0 ? ((totalRech / totalLiq) * 100).toFixed(2) : '0.00';

    // Totales del hoja Resumen (incluye transportistas con cero rechazo)
    const totalLiqRes = transportistasResumen.reduce((s, t) => s + Number(t.total_liq), 0);
    const totalRechRes = transportistasResumen.reduce((s, t) => s + Number(t.total_rechazo), 0);
    const totalDocsRechRes = transportistasResumen.reduce((s, t) => s + Number(t.docs_rechazados), 0);
    const totalNetaRes = totalLiqRes - totalRechRes;
    const pctGlobalRes = totalLiqRes > 0 ? ((totalRechRes / totalLiqRes) * 100).toFixed(2) : '0.00';

    // KPIs
    const kpiRow = 4;
    const kpis = [
      { label: 'Total Liquidacion', value: `S/ ${constMoney(totalLiqRes)}`, color: 'FF465FFF' },
      { label: 'Total Rechazado', value: `S/ ${constMoney(totalRechRes)}`, color: 'FFF97066' },
      { label: 'Liquidacion Neta', value: `S/ ${constMoney(totalNetaRes)}`, color: 'FF00C49F' },
      { label: '% Rechazo Global', value: `${pctGlobalRes}%`, color: pctGlobalRes >= 10 ? 'FFF97066' : 'FF00C49F' },
    ];
    kpis.forEach((kpi, i) => {
      const col = i * 2 + 1;
      ws1.getCell(kpiRow, col).value = kpi.label;
      ws1.getCell(kpiRow, col).font = { bold: true, size: 10, color: { argb: 'FF6B7280' } };
      ws1.getCell(kpiRow + 1, col).value = kpi.value;
      ws1.getCell(kpiRow + 1, col).font = { bold: true, size: 14, color: { argb: kpi.color } };
    });

    // Headers tabla - Fila 8: encabezado principal
    const headersRes = ['Transportista', 'Nombre', 'Liq. Programada', 'Rechazado', 'Liq. Neta sin Aut', 'Docs Rech.', 'Cajas Físicas CF', '', '% Rechazo', 'Nivel'];
    const headerRowRes = 8;
    headersRes.forEach((h, i) => {
      const cell = ws1.getCell(headerRowRes, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    // Merge del encabezado "Cajas Físicas CF" sobre Cajas y Unidades
    ws1.mergeCells(headerRowRes, 7, headerRowRes, 8);
    ws1.getRow(headerRowRes).height = 25;

    // Fila 9: sub-encabezados de Cajas Físicas
    const subHeaderRow = 9;
    const cajasSubHeaders = ['Cajas', 'Unidades'];
    cajasSubHeaders.forEach((h, i) => {
      const cell = ws1.getCell(subHeaderRow, 7 + i);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    // Bordes para las celdas vacías debajo de los otros headers
    for (let col = 1; col <= 6; col++) {
      ws1.getCell(subHeaderRow, col).border = borderStyle;
    }
    for (let col = 9; col <= 10; col++) {
      ws1.getCell(subHeaderRow, col).border = borderStyle;
    }

    transportistasResumen.forEach((t, idx) => {
      const row = headerRowRes + 2 + idx;
      const esCeroRechazo = Number(t.total_rechazo) <= 0 && Number(t.total_cajas) <= 0;
      const esMinimo = !esCeroRechazo && Number(t.porcentaje_rechazo) < 0.5;
      const nivel = esCeroRechazo ? NIVEL_CERO
        : esMinimo ? NIVEL_MINIMO
        : t.porcentaje_rechazo >= 15 ? 'Critico'
        : t.porcentaje_rechazo >= 8 ? 'Alto'
        : t.porcentaje_rechazo >= 3 ? 'Moderado'
        : 'Bajo';
      const fillColor = esCeroRechazo ? ceroFill
        : esMinimo ? minimoFill
        : t.porcentaje_rechazo >= 15 ? criticoFill
        : t.porcentaje_rechazo >= 8 ? altoFill
        : t.porcentaje_rechazo >= 3 ? moderadoFill
        : null;
      const nivelFont = esCeroRechazo ? ceroFont
        : esMinimo ? minimoFont
        : null;

      const values = [
        t.codigo_identificador, `${t.nombres} ${t.apellidos}`, Number(t.total_liq),
        Number(t.total_rechazo), Number(t.liquidacion_neta), Number(t.docs_rechazados),
        Number(t.total_cajas), Number(t.total_unidades),
        `${t.porcentaje_rechazo}%`, nivel
      ];
      values.forEach((v, ci) => {
        const cell = ws1.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        cell.alignment = { horizontal: ci >= 2 ? 'right' : 'left', vertical: 'middle' };
        if (fillColor) cell.fill = fillColor;
        if (nivelFont && ci === 9) cell.font = nivelFont;
        if (ci >= 2 && ci <= 5) cell.numFmt = '#,##0.00';
        if (ci === 5 || ci === 6 || ci === 7) cell.numFmt = '#,##0';
      });
    });

    // Fila total
    const totalCajasRes = transportistasResumen.reduce((s, t) => s + Number(t.total_cajas), 0);
    const totalUnidadesRes = transportistasResumen.reduce((s, t) => s + Number(t.total_unidades), 0);
    const totalRowRes = headerRowRes + 2 + transportistasResumen.length + 1;
    const totalsRes = ['TOTALES', '', totalLiqRes, totalRechRes, totalNetaRes, totalDocsRechRes, totalCajasRes, totalUnidadesRes, `${pctGlobalRes}%`, ''];
    totalsRes.forEach((v, i) => {
      const cell = ws1.getCell(totalRowRes, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = totalFill;
      cell.border = borderStyle;
      if (i >= 2 && i <= 5) cell.numFmt = '#,##0.00';
      if (i === 5 || i === 6 || i === 7) cell.numFmt = '#,##0';
    });

    // Leyenda de niveles
    const nivelesLeyenda = [
      { row: 0, col: 1, label: 'Niveles:', fill: null, color: 'FF6B7280', bold: true },
      { row: 0, col: 2, span: 3, label: NIVEL_CERO, fill: ceroFill, color: 'FF047857' },
      { row: 0, col: 5, span: 3, label: NIVEL_MINIMO, fill: minimoFill, color: 'FF15803D' },
      { row: 0, col: 8, span: 3, label: 'Bajo (0.5% - 2.99%)', fill: null, color: 'FF374151' },
      { row: 1, col: 2, span: 3, label: 'Moderado (3% - 7.99%)', fill: moderadoFill, color: 'FFB45309' },
      { row: 1, col: 5, span: 3, label: 'Alto (8% - 14.99%)', fill: altoFill, color: 'FFC2410C' },
      { row: 1, col: 8, span: 3, label: 'Critico (15% o mas)', fill: criticoFill, color: 'FFB91C1C' },
    ];
    nivelesLeyenda.forEach((n) => {
      const leyendaRow = totalRowRes + 2 + n.row;
      const span = n.span || 1;
      for (let c = n.col; c < n.col + span; c++) {
        const cell = ws1.getCell(leyendaRow, c);
        if (n.fill) cell.fill = n.fill;
        if (span > 1) cell.border = borderStyle;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      const labelCell = ws1.getCell(leyendaRow, n.col);
      labelCell.value = n.label;
      labelCell.font = { bold: n.bold !== false, size: 10, color: { argb: n.color } };
      if (span > 1) ws1.mergeCells(leyendaRow, n.col, leyendaRow, n.col + span - 1);
    });

    // ========== HOJA 2: CAJAS FISICAS POR RECHAZO ==========
    const ws2 = wb.addWorksheet('Cajas Físicas', { properties: { tabColor: { argb: 'FF0EA5E9' } } });
    ws2.columns = [
      { width: 15 }, { width: 25 }, { width: 18 }, { width: 20 }, { width: 18 }, { width: 20 }, { width: 14 }, { width: 14 }
    ];

    ws2.mergeCells('A1:H1');
    ws2.getCell('A1').value = `CAJAS FÍSICAS POR RECHAZO VS PROGRAMADAS - ${fechaFmt}`;
    ws2.getCell('A1').font = { ...titleFont, color: { argb: 'FF0284C7' } };
    ws2.getCell('A1').alignment = { horizontal: 'center' };
    ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    ws2.getRow(1).height = 30;

    const headersCajas = ['Codigo', 'Nombre', 'Cargas Programadas', 'Unidades Programadas', 'Cargas Rechazadas', 'Unidades Rechazadas', '% Rechazo', 'Nivel'];
    headersCajas.forEach((h, i) => {
      const cell = ws2.getCell(3, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });
    ws2.getRow(3).height = 25;

    cajasFisicas.forEach((t, idx) => {
      const row = 4 + idx;
      const pct = Number(t.porcentaje_cajas);
      const esCeroRechazo = Number(t.cajas_fisicas) <= 0 && Number(t.unidades_fisicas) <= 0;
      const esMinimo = !esCeroRechazo && pct < 0.5;
      const nivel = esCeroRechazo ? NIVEL_CERO
        : esMinimo ? NIVEL_MINIMO
        : pct >= 15 ? 'CRITICO'
        : pct >= 8 ? 'ALTO'
        : pct >= 3 ? 'MODERADO'
        : 'BAJO';
      const fillColor = esCeroRechazo ? ceroFill
        : esMinimo ? minimoFill
        : pct >= 15 ? criticoFill
        : pct >= 8 ? altoFill
        : pct >= 3 ? moderadoFill
        : null;
      const nivelFont = esCeroRechazo ? ceroFont
        : esMinimo ? minimoFont
        : null;

      const vals = [
        t.codigo_identificador, `${t.nombres} ${t.apellidos}`, Number(t.cargas_programadas),
        Number(t.unidades_programadas), Number(t.cajas_fisicas), Number(t.unidades_fisicas),
        Number(t.porcentaje_cajas), nivel
      ];
      vals.forEach((v, ci) => {
        const cell = ws2.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        if (ci === 2 || ci === 3 || ci === 4 || ci === 5) cell.numFmt = '#,##0';
        if (ci === 6) cell.numFmt = '0.00"%"';
        if (fillColor) cell.fill = fillColor;
        if (nivelFont && ci === 7) cell.font = nivelFont;
      });
    });

    const totalRowCajas = 4 + cajasFisicas.length + 1;
    const totalCargas = cajasFisicas.reduce((s, r) => s + Number(r.cargas_programadas), 0);
    const totalUnidProg = cajasFisicas.reduce((s, r) => s + Number(r.unidades_programadas), 0);
    const totalCajasRech = cajasFisicas.reduce((s, r) => s + Number(r.cajas_fisicas), 0);
    const totalUnidRech = cajasFisicas.reduce((s, r) => s + Number(r.unidades_fisicas), 0);
    const pctCajasGlobal = totalCargas > 0 ? (totalCajasRech * 100.0 / totalCargas).toFixed(2) : '0.00';
    const totalsCajas = [
      'TOTALES', '', totalCargas, totalUnidProg, totalCajasRech, totalUnidRech, `${pctCajasGlobal}%`, ''
    ];
    totalsCajas.forEach((v, i) => {
      const cell = ws2.getCell(totalRowCajas, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = totalFill;
      cell.border = borderStyle;
      if (i === 2 || i === 3 || i === 4 || i === 5) cell.numFmt = '#,##0';
    });

    // Leyenda de niveles - Cajas Fisicas
    const nivelesCajas = [
      { row: 0, col: 1, label: 'Niveles:', fill: null, color: 'FF6B7280', bold: true },
      { row: 0, col: 2, span: 2, label: NIVEL_CERO, fill: ceroFill, color: 'FF166534' },
      { row: 0, col: 4, span: 2, label: NIVEL_MINIMO, fill: minimoFill, color: 'FF15803D' },
      { row: 0, col: 6, span: 3, label: 'Bajo (0.5% - 2.99%)', fill: null, color: 'FF374151' },
      { row: 1, col: 2, span: 2, label: 'Moderado (3% - 7.99%)', fill: moderadoFill, color: 'FFB45309' },
      { row: 1, col: 4, span: 2, label: 'Alto (8% - 14.99%)', fill: altoFill, color: 'FFC2410C' },
      { row: 1, col: 6, span: 3, label: 'Critico (15% o mas)', fill: criticoFill, color: 'FFB91C1C' },
    ];
    nivelesCajas.forEach((n) => {
      const leyendaRow = totalRowCajas + 2 + n.row;
      const span = n.span || 1;
      for (let c = n.col; c < n.col + span; c++) {
        const cell = ws2.getCell(leyendaRow, c);
        if (n.fill) cell.fill = n.fill;
        if (span > 1) cell.border = borderStyle;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      const labelCell = ws2.getCell(leyendaRow, n.col);
      labelCell.value = n.label;
      labelCell.font = { bold: n.bold !== false, size: 10, color: { argb: n.color } };
      if (span > 1) ws2.mergeCells(leyendaRow, n.col, leyendaRow, n.col + span - 1);
    });

    // ========== HOJA 3: DOCUMENTOS ==========
    const ws3 = wb.addWorksheet('Documentos', { properties: { tabColor: { argb: 'FF465FFF' } } });
    ws3.columns = [
      { width: 15 }, { width: 25 }, { width: 10 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 15 }
    ];

    ws3.mergeCells('A1:G1');
    ws3.getCell('A1').value = `DOCUMENTOS DEL DIA - ${fechaFmt}`;
    ws3.getCell('A1').font = titleFont;
    ws3.getCell('A1').alignment = { horizontal: 'center' };
    ws3.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    ws3.getRow(1).height = 30;

    const headersDocs = ['Codigo', 'Nombre', 'Carga', 'Liq. Programada', 'Cant. Docs', 'Liq. Total', 'Fecha'];
    headersDocs.forEach((h, i) => {
      const cell = ws3.getCell(3, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });
    ws3.getRow(3).height = 25;

    docsDelDia.forEach((d, idx) => {
      const row = 4 + idx;
      const vals = [
        d.codigo_identificador, `${d.nombres} ${d.apellidos}`, d.carga || '-',
        Number(d.liquidacion_programada || 0), Number(d.cant_documentos || 0),
        Number(d.liquidacion_total_diaria || 0),
        d.fecha_documentos ? String(d.fecha_documentos).split('T')[0] : ''
      ];
      vals.forEach((v, ci) => {
        const cell = ws3.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        if (ci === 3 || ci === 5) cell.numFmt = '#,##0.00';
        if (ci === 4) cell.numFmt = '#,##0';
      });
    });

    const totalRowDocs = 4 + docsDelDia.length + 1;
    const totalsDocs = [
      'TOTAL', '', '',
      docsDelDia.reduce((s, d) => s + Number(d.liquidacion_programada || 0), 0),
      docsDelDia.reduce((s, d) => s + Number(d.cant_documentos || 0), 0),
      docsDelDia.reduce((s, d) => s + Number(d.liquidacion_total_diaria || 0), 0),
      ''
    ];
    totalsDocs.forEach((v, i) => {
      const cell = ws3.getCell(totalRowDocs, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = totalFill;
      cell.border = borderStyle;
      if (i === 3 || i === 5) cell.numFmt = '#,##0.00';
      if (i === 4) cell.numFmt = '#,##0';
    });

    // ========== HOJA 4: ANALISIS ==========
    const wsAn = wb.addWorksheet('Analisis', { properties: { tabColor: { argb: 'FF7C3AED' } } });
    wsAn.columns = [
      { width: 45 }, { width: 18 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 16 }, { width: 15 }
    ];

    wsAn.mergeCells('A1:G1');
    wsAn.getCell('A1').value = `ANALISIS DEL DIA - ${fechaFmt}`;
    wsAn.getCell('A1').font = { ...titleFont, color: { argb: 'FF7C3AED' } };
    wsAn.getCell('A1').alignment = { horizontal: 'center' };
    wsAn.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
    wsAn.getRow(1).height = 30;

    const headersAnalisis = ['Motivo', 'Cant. Documentos', 'Cajas', 'Unidades', 'Clientes', 'Importe (S/)', 'Fecha'];
    headersAnalisis.forEach((h, i) => {
      const cell = wsAn.getCell(3, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });
    wsAn.getRow(3).height = 25;

    analisisDelDia.forEach((a, idx) => {
      const row = 4 + idx;
      const vals = [
        a.motivo_anulacion,
        Number(a.cant_analisis || 0),
        Number(a.cajas_motivo || 0),
        Number(a.unidades_motivo || 0),
        Number(a.cantidad_motivo || 0),
        Number(a.importe || 0),
        a.fecha_analisis ? String(a.fecha_analisis).split('T')[0] : ''
      ];
      vals.forEach((v, ci) => {
        const cell = wsAn.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        if (ci >= 1 && ci <= 4) cell.numFmt = '#,##0';
        if (ci === 5) cell.numFmt = '#,##0.00';
      });
    });

    if (analisisDelDia.length === 0) {
      wsAn.mergeCells('A4:G4');
      const emptyCell = wsAn.getCell('A4');
      emptyCell.value = 'Sin registros de analisis para esta fecha';
      emptyCell.font = { italic: true, size: 11, color: { argb: 'FF6B7280' } };
      emptyCell.alignment = { horizontal: 'center' };
      emptyCell.border = borderStyle;
    }

    const totalRowAn = 4 + analisisDelDia.length + 1;
    const totalsAnalisis = [
      'TOTAL',
      analisisDelDia.reduce((s, a) => s + Number(a.cant_analisis || 0), 0),
      analisisDelDia.reduce((s, a) => s + Number(a.cajas_motivo || 0), 0),
      analisisDelDia.reduce((s, a) => s + Number(a.unidades_motivo || 0), 0),
      analisisDelDia.reduce((s, a) => s + Number(a.cantidad_motivo || 0), 0),
      analisisDelDia.reduce((s, a) => s + Number(a.importe || 0), 0),
      ''
    ];
    totalsAnalisis.forEach((v, i) => {
      const cell = wsAn.getCell(totalRowAn, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = totalFill;
      cell.border = borderStyle;
      if (i >= 1 && i <= 4) cell.numFmt = '#,##0';
      if (i === 5) cell.numFmt = '#,##0.00';
    });

    // ========== HOJA 5: RECHAZOS ==========
    const ws4 = wb.addWorksheet('Rechazos', { properties: { tabColor: { argb: 'FFF97066' } } });
    ws4.columns = [
      { width: 15 }, { width: 25 }, { width: 20 }, { width: 18 }, { width: 18 }, { width: 10 }, { width: 12 }, { width: 15 }, { width: 18 }, { width: 15 }
    ];

    ws4.mergeCells('A1:J1');
    ws4.getCell('A1').value = `RECHAZOS DEL DIA - ${fechaFmt}`;
    ws4.getCell('A1').font = { ...titleFont, color: { argb: 'FFF97066' } };
    ws4.getCell('A1').alignment = { horizontal: 'center' };
    ws4.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    ws4.getRow(1).height = 30;

    const headersRech = ['Codigo', 'Nombre', 'Cant. Rechazada (S/)', 'Total Rechazo (S/)', 'Docs Rechazados', 'Cajas', 'Unidades', 'Doc. Finales', 'Liq. Final', 'Fecha'];
    headersRech.forEach((h, i) => {
      const cell = ws4.getCell(3, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });
    ws4.getRow(3).height = 25;

    rechazosDelDia.forEach((r, idx) => {
      const row = 4 + idx;
      const vals = [
        r.codigo_identificador, `${r.nombres} ${r.apellidos}`,
        Number(r.cantidad_rechazada || 0), Number(r.total_rechazo || 0),
        Number(r.cant_documentos_rechazados || 0),
        Number(r.cajas_fisicas || 0), Number(r.unidades_fisicas || 0),
        Number(r.documentos_finales || 0),
        Number(r.liquidacion_final || 0),
        r.fecha_rechazo ? String(r.fecha_rechazo).split('T')[0] : ''
      ];
      vals.forEach((v, ci) => {
        const cell = ws4.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        if (ci >= 2 && ci <= 4) cell.numFmt = '#,##0.00';
        if (ci === 5 || ci === 6) cell.numFmt = '#,##0';
        if (ci === 7 || ci === 8) cell.numFmt = '#,##0.00';
      });
    });

    const totalRowRech = 4 + rechazosDelDia.length + 1;
    const totalsRech = [
      'TOTAL', '',
      rechazosDelDia.reduce((s, r) => s + Number(r.cantidad_rechazada || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.total_rechazo || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.cant_documentos_rechazados || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.cajas_fisicas || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.unidades_fisicas || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.documentos_finales || 0), 0),
      rechazosDelDia.reduce((s, r) => s + Number(r.liquidacion_final || 0), 0),
      ''
    ];
    totalsRech.forEach((v, i) => {
      const cell = ws4.getCell(totalRowRech, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      cell.border = borderStyle;
      if (i >= 2 && i <= 4) cell.numFmt = '#,##0.00';
      if (i === 5 || i === 6) cell.numFmt = '#,##0';
      if (i === 7 || i === 8) cell.numFmt = '#,##0.00';
    });

    // ========== HOJA 6: DETALLE TRANSPORTISTAS ==========
    const ws5 = wb.addWorksheet('Detalle Transportistas', { properties: { tabColor: { argb: 'FF00C49F' } } });
    ws5.columns = [
      { width: 15 }, { width: 25 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 14 }
    ];

    ws5.mergeCells('A1:H1');
    ws5.getCell('A1').value = `DETALLE POR TRANSPORTISTA - ${fechaFmt}`;
    ws5.getCell('A1').font = { ...titleFont, color: { argb: 'FF059669' } };
    ws5.getCell('A1').alignment = { horizontal: 'center' };
    ws5.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    ws5.getRow(1).height = 30;

    const headersDet = ['Codigo', 'Nombre', 'Liq. Programada', 'Rechazado', 'Liq. Neta sin Aut', '% Rechazo', 'Docs Rech.', 'Nivel'];
    headersDet.forEach((h, i) => {
      const cell = ws5.getCell(3, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });
    ws5.getRow(3).height = 25;

    transportistas.forEach((t, idx) => {
      const row = 4 + idx;
      const nivel = t.porcentaje_rechazo >= 15 ? 'CRITICO' : t.porcentaje_rechazo >= 8 ? 'ALTO' : t.porcentaje_rechazo >= 3 ? 'MODERADO' : 'BAJO';
      const fillColor = t.porcentaje_rechazo >= 15 ? criticoFill : t.porcentaje_rechazo >= 8 ? altoFill : t.porcentaje_rechazo >= 3 ? moderadoFill : null;

      const vals = [
        t.codigo_identificador, `${t.nombres} ${t.apellidos}`, Number(t.total_liq),
        Number(t.total_rechazo), Number(t.liquidacion_neta), Number(t.porcentaje_rechazo),
        Number(t.docs_rechazados), nivel
      ];
      vals.forEach((v, ci) => {
        const cell = ws5.getCell(row, ci + 1);
        cell.value = v;
        cell.border = borderStyle;
        if (ci >= 2 && ci <= 5) cell.numFmt = ci === 5 ? '0.00"%"' : '#,##0.00';
        if (ci === 6) cell.numFmt = '#,##0';
        if (fillColor) cell.fill = fillColor;
      });
    });

    const totalRowDet = 4 + transportistas.length + 1;
    const totalsDet = [
      'TOTALES', '', totalLiq, totalRech, totalNeta, `${pctGlobal}%`, totalDocsRech, ''
    ];
    totalsDet.forEach((v, i) => {
      const cell = ws5.getCell(totalRowDet, i + 1);
      cell.value = v;
      cell.font = totalFont;
      cell.fill = totalFill;
      cell.border = borderStyle;
      if (i >= 2 && i <= 5) cell.numFmt = '#,##0.00';
      if (i === 7) cell.numFmt = '#,##0';
    });

    // ========== GENERAR ARCHIVO ==========
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_rechazos_${fecha}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ message: 'Error al generar el reporte' });
  }
});

router.get('/top-5-motivos', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);

    const [rows] = await pool.query(
      `SELECT motivo_anulacion,
              COALESCE(SUM(cant_analisis), 0) AS cantidad,
              COALESCE(SUM(cajas_motivo), 0) AS cajas,
              COALESCE(SUM(unidades_motivo), 0) AS unidades,
              COALESCE(SUM(cantidad_motivo), 0) AS clientes,
              SUM(importe) AS total_importe
       FROM analisis
       WHERE DATE(fecha_analisis) = ?
       GROUP BY motivo_anulacion
       ORDER BY total_importe DESC`,
      [fecha]
    );

    const totalImporte = rows.reduce((s, r) => s + Number(r.total_importe), 0);
    const motivos = rows.map((r) => ({
      motivo: r.motivo_anulacion,
      cantidad: r.cantidad,
      cajas: Number(r.cajas),
      unidades: Number(r.unidades),
      clientes: Number(r.clientes),
      total_importe: Number(r.total_importe),
      porcentaje: totalImporte > 0 ? ((Number(r.total_importe) / totalImporte) * 100).toFixed(1) : '0.0'
    }));

    res.json({ motivos, totalImporte, fecha });
  } catch (error) {
    console.error('Error en top-5-motivos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/top-10-cajas', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);

    const [rows] = await pool.query(
      `SELECT r.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(r.cajas_fisicas), 0) AS cajas_fisicas,
              COALESCE(SUM(d.cargas_programadas), 0) AS cargas_programadas,
              CASE
                WHEN COALESCE(SUM(d.cargas_programadas), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(SUM(r.cajas_fisicas), 0) / SUM(d.cargas_programadas)) * 100, 2)
              END AS porcentaje_cajas
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       LEFT JOIN (
         SELECT codigo_identificador, fecha_documentos,
                SUM(cargas_programadas) AS cargas_programadas
         FROM documentos
         WHERE fecha_documentos = ?
         GROUP BY codigo_identificador, fecha_documentos
       ) d ON r.codigo_identificador = d.codigo_identificador AND DATE(r.fecha_rechazo) = d.fecha_documentos
       WHERE DATE(r.fecha_rechazo) = ? AND COALESCE(r.cajas_fisicas, 0) > 0
       GROUP BY r.codigo_identificador, t.nombres, t.apellidos
       ORDER BY porcentaje_cajas DESC
       LIMIT 10`,
      [fecha, fecha]
    );

    res.json({ data: rows, fecha });
  } catch (error) {
    console.error('Error en top-10-cajas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/rechazo-minimo-cajas', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);

    const [rows] = await pool.query(
      `SELECT d.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(d.cargas_programadas), 0) AS cargas_programadas,
              COALESCE(SUM(d.unidades_programadas), 0) AS unidades_programadas,
              COALESCE(r.cajas_fisicas, 0) AS cajas_fisicas,
              COALESCE(r.unidades_fisicas, 0) AS unidades_fisicas,
              CASE
                WHEN COALESCE(SUM(d.cargas_programadas), 0) = 0 THEN 0
                ELSE ROUND((COALESCE(r.cajas_fisicas, 0) / SUM(d.cargas_programadas)) * 100, 2)
              END AS porcentaje_cajas
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       LEFT JOIN (
         SELECT codigo_identificador,
                SUM(cajas_fisicas) AS cajas_fisicas,
                SUM(unidades_fisicas) AS unidades_fisicas
         FROM rechazos
         WHERE DATE(fecha_rechazo) = ?
         GROUP BY codigo_identificador
       ) r ON d.codigo_identificador = r.codigo_identificador
       WHERE DATE(d.fecha_documentos) = ? AND COALESCE(d.cargas_programadas, 0) > 0
       GROUP BY d.codigo_identificador, t.nombres, t.apellidos, r.cajas_fisicas, r.unidades_fisicas
       HAVING porcentaje_cajas < 0.5
       ORDER BY porcentaje_cajas ASC, cajas_fisicas ASC`,
      [fecha, fecha]
    );

    const data = rows.map((r) => ({
      codigo_identificador: r.codigo_identificador,
      nombres: r.nombres,
      apellidos: r.apellidos,
      cargas_programadas: Number(r.cargas_programadas),
      unidades_programadas: Number(r.unidades_programadas),
      cajas_fisicas: Number(r.cajas_fisicas),
      unidades_fisicas: Number(r.unidades_fisicas),
      porcentaje_cajas: Number(r.porcentaje_cajas),
    }));

    const totalCargas = data.reduce((s, r) => s + r.cargas_programadas, 0);
    const totalUnidadesProg = data.reduce((s, r) => s + r.unidades_programadas, 0);
    const totalCajas = data.reduce((s, r) => s + r.cajas_fisicas, 0);
    const totalUnidades = data.reduce((s, r) => s + r.unidades_fisicas, 0);
    const porcentajeGlobal = totalCargas > 0 ? ((totalCajas / totalCargas) * 100).toFixed(2) : '0.00';

    res.json({
      data,
      fecha,
      count: data.length,
      totalCargas,
      totalUnidadesProg,
      totalCajas,
      totalUnidades,
      porcentajeGlobal,
    });
  } catch (error) {
    console.error('Error en rechazo-minimo-cajas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/calendario-rechazos', isAuthenticated, async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;

    if (!start || !end) {
      return res.status(400).json({ message: 'Parametros start y end requeridos' });
    }

    const [rows] = await pool.query(
      `SELECT DATE(fecha_rechazo) AS fecha,
              COALESCE(SUM(cajas_fisicas), 0) AS total_cajas,
              COUNT(DISTINCT codigo_identificador) AS conductores
       FROM rechazos
       WHERE fecha_rechazo >= ? AND fecha_rechazo <= ?
         AND COALESCE(cajas_fisicas, 0) > 0
       GROUP BY DATE(fecha_rechazo)
       ORDER BY fecha`,
      [start, end]
    );

    const events = rows.map((r) => ({
      title: `${Number(r.total_cajas)} cajas`,
      start: new Date(r.fecha).toISOString().split('T')[0],
      totalCajas: Number(r.total_cajas),
      conductores: Number(r.conductores),
    }));

    res.json({ events });
  } catch (error) {
    console.error('Error en calendario-rechazos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/top-3-rechazos', isAuthenticated, async (req, res) => {
  try {
    const fecha = req.query.fecha || getFechaLocal(-1);

    const [rows] = await pool.query(
      `SELECT r.codigo_identificador,
              t.nombres, t.apellidos,
              COALESCE(SUM(r.cajas_fisicas), 0) AS cajas_fisicas
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       WHERE DATE(r.fecha_rechazo) = ? AND COALESCE(r.cajas_fisicas, 0) > 0
       GROUP BY r.codigo_identificador, t.nombres, t.apellidos
       ORDER BY cajas_fisicas DESC
       LIMIT 3`,
      [fecha]
    );

    const [totalRow] = await pool.query(
      `SELECT COALESCE(SUM(cajas_fisicas), 0) AS total_dia
       FROM rechazos
       WHERE DATE(fecha_rechazo) = ? AND COALESCE(cajas_fisicas, 0) > 0`,
      [fecha]
    );

    const totalDia = Number(totalRow[0].total_dia);
    const data = rows.map((r) => ({
      codigo_identificador: r.codigo_identificador,
      nombres: r.nombres,
      apellidos: r.apellidos,
      cajas_fisicas: Number(r.cajas_fisicas),
      porcentaje: totalDia > 0
        ? ((Number(r.cajas_fisicas) / totalDia) * 100).toFixed(1)
        : '0.0',
    }));

    res.json({ data, totalDia, fecha });
  } catch (error) {
    console.error('Error en top-3-rechazos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
