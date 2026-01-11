// Bank Penerima Database
// Daftar rekening bank yang tersedia untuk pembayaran

export type BankType = "BSI" | "BCA";

export interface BankAccount {
  id: string;
  bankType: BankType;
  kodeLembaga: string;
  nomorRekening: string;
  namaPenerima: string;
}

// Daftar Bank Yang Tersedia di Dropdown Utama
export const AVAILABLE_BANKS = [
  { value: "BSI", label: "BSI (Bank Syariah Indonesia)" },
  // { value: "BCA", label: "BCA (Bank Central Asia)" },
  { value: "lainnya", label: "Lainnya (Input Manual)" },
] as const;

// Database Rekening Bank
// Format tampilan: kodeLembaga - nomorRekening
export const BANK_ACCOUNTS: BankAccount[] = [
  // BSI Accounts - Semua atas nama Yayasan Sunniyah Salafiyah
  {
    id: "bsi-01",
    bankType: "BSI",
    kodeLembaga: "PDA",
    nomorRekening: "4709208490",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-02",
    bankType: "BSI",
    kodeLembaga: "PDF",
    nomorRekening: "4709183980",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-03",
    bankType: "BSI",
    kodeLembaga: "SPA",
    nomorRekening: "4709181490",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-04",
    bankType: "BSI",
    kodeLembaga: "SMA",
    nomorRekening: "4735324140",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-05",
    bankType: "BSI",
    kodeLembaga: "MDA",
    nomorRekening: "1207715292",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-06",
    bankType: "BSI",
    kodeLembaga: "PDI",
    nomorRekening: "4735326730",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-07",
    bankType: "BSI",
    kodeLembaga: "SPI",
    nomorRekening: "4709180700",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-08",
    bankType: "BSI",
    kodeLembaga: "MDI",
    nomorRekening: "5076187050",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-09",
    bankType: "BSI",
    kodeLembaga: "SMKI",
    nomorRekening: "5220105280",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-10",
    bankType: "BSI",
    kodeLembaga: "STIT",
    nomorRekening: "8362367080",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-11",
    bankType: "BSI",
    kodeLembaga: "PDT",
    nomorRekening: "8058770890",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-12",
    bankType: "BSI",
    kodeLembaga: "PDB",
    nomorRekening: "1207715995",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  {
    id: "bsi-13",
    bankType: "BSI",
    kodeLembaga: "PPG",
    nomorRekening: "7296792448",
    namaPenerima: "Yayasan Sunniyah Salafiyah",
  },
  // BCA Accounts (commented - uncomment when ready)
  // {
  //   id: "bca-1",
  //   bankType: "BCA",
  //   kodeLembaga: "YSS",
  //   nomorRekening: "1234567890",
  //   namaPenerima: "Yayasan Sunniyah Salafiyah",
  // },
  // {
  //   id: "bca-2",
  //   bankType: "BCA",
  //   kodeLembaga: "PP",
  //   nomorRekening: "0987654321",
  //   namaPenerima: "Yayasan Sunniyah Salafiyah",
  // },
];

// Helper: Filter accounts by bank type
export function getAccountsByBank(bankType: BankType): BankAccount[] {
  return BANK_ACCOUNTS.filter((acc) => acc.bankType === bankType);
}

// Helper: Get account by ID
export function getAccountById(id: string): BankAccount | undefined {
  return BANK_ACCOUNTS.find((acc) => acc.id === id);
}

// Helper: Format account for dropdown display
export function formatAccountDisplay(account: BankAccount): string {
  return `${account.kodeLembaga} - ${account.nomorRekening}`;
}
