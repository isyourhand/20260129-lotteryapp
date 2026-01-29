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

export const exportToExcel = (
  history: Record<number, Participant[]>,
  prizes: PrizeConfig[],
) => {
  // 1. 扁平化数据结构
  // 我们要把 history 对象转换成一个平铺的数组，方便生成表格
  const data = prizes.flatMap((prize) => {
    const winners = history[prize.level] || [];
    return winners.map((winner) => ({
      奖项等级: prize.name, // 例如：一等奖
      具体奖品: winner.specificPrize || prize.name, // 例如：HUAWEI 平板
      "工号/ID": winner.id,
      姓名: winner.name,
      部门: winner.department,
    }));
  });

  if (data.length === 0) {
    alert("暂无中奖记录，无需导出");
    return;
  }

  // 2. 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. 设置列宽 (追求视觉完美)
  const wscols = [
    { wch: 15 }, // 奖项等级
    { wch: 25 }, // 具体奖品
    { wch: 10 }, // ID
    { wch: 15 }, // 姓名
    { wch: 20 }, // 部门
  ];
  worksheet["!cols"] = wscols;

  // 4. 创建工作簿并导出
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "中奖名单");

  // 生成文件名：中奖名单_2023-xx-xx_12-30.xlsx
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  XLSX.writeFile(workbook, `中奖名单_${timestamp}.xlsx`);
};
