// src/services/xlsx.ts
import * as XLSX from "xlsx";
import type { Participant } from "../types";

export const parseExcel = (file: File): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // 将 Excel 转换为 JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // 映射数据格式 (处理中文表头)
      const participants: Participant[] = jsonData.map((row: any) => ({
        id: row["序号"],
        name: row["姓名"],
        department: row["部门"],
        revealing: 0,
      }));

      resolve(participants);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
