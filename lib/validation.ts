/**
 * Normalisasi command input pengguna:
 * 1. Trim spasi di awal dan akhir string.
 * 2. Menggabungkan spasi ganda/berlebih menjadi satu spasi tunggal.
 * 3. Tetap menjaga case-sensitivity untuk nama file/folder (jangan di-lowercase).
 */
export function normalizeCommand(input: string): string {
  if (!input) return "";
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Validasi apakah input pengguna cocok dengan salah satu acceptedAnswers yang benar.
 */
export function validateAnswer(input: string, acceptedAnswers: string[]): boolean {
  const normalizedInput = normalizeCommand(input);
  
  return acceptedAnswers.some((answer) => {
    return normalizeCommand(answer) === normalizedInput;
  });
}
