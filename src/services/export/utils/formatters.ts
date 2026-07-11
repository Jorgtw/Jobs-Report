import * as ExcelJS from 'exceljs';

export const ReportStyles = {
  // Colori base
  colors: {
    primaryDarkBlue: 'FF1F3864',
    primaryBlue: 'FF2F5597',
    secondaryBlue: 'FF8FAADC',
    lightGray: 'FFF2F2F2',
    white: 'FFFFFFFF',
    black: 'FF000000',
  },
  
  // Formato valuta senza simbolo Euro per chiarezza e semplicità (stile "bambini asilo")
  currencyFormat: '#,##0.00',
  
  // Font di base
  font: {
    base: { name: 'Arial', size: 10 },
    bold: { name: 'Arial', size: 10, bold: true },
    header: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
    subHeader: { name: 'Arial', size: 11, italic: true, color: { argb: 'FFFFFFFF' } }
  },

  // Bordi standard per le tabelle
  borders: {
    standard: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    } as ExcelJS.Borders
  }
};

export const applyHeaderStyle = (cell: ExcelJS.Cell) => {
  cell.font = ReportStyles.font.header;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ReportStyles.colors.primaryDarkBlue }
  };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
};

export const applySubHeaderStyle = (cell: ExcelJS.Cell) => {
  cell.font = ReportStyles.font.subHeader;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ReportStyles.colors.primaryDarkBlue }
  };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
};

export const applyTableHeaderStyle = (cell: ExcelJS.Cell, alignment: 'left' | 'center' | 'right' = 'center') => {
  cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: ReportStyles.colors.primaryDarkBlue } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ReportStyles.colors.secondaryBlue } // a lighter blue
  };
  cell.border = ReportStyles.borders.standard;
  cell.alignment = { vertical: 'middle', horizontal: alignment };
};

export const applyDataStyle = (cell: ExcelJS.Cell, alignment: 'left' | 'center' | 'right' = 'center') => {
  cell.font = ReportStyles.font.base;
  cell.border = ReportStyles.borders.standard;
  cell.alignment = { vertical: 'middle', horizontal: alignment };
};
