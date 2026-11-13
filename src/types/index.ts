// 会员相关类型定义

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  gender?: "male" | "female";
  birthday?: string;
  cardType: CardType;
  cardNumber: string;
  balance: number;
  points: number;
  level: MemberLevel;
  remainingSessions: number;
  status: MemberStatus;
  registrationDate: string;
  expiryDate: string;
  lastVisitDate?: string;
  notes?: string;
  avatar?: string;
  archived?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CardType = "times" | "day" | "monthly" | "quarterly" | "yearly";
export type MemberLevel = "bronze" | "silver" | "gold" | "diamond";
export type MemberStatus = "active" | "expired" | "frozen";

export const CARD_TYPE_NAMES: Record<CardType, string> = {
  times: "次数卡",
  day: "日卡",
  monthly: "月卡",
  quarterly: "季卡",
  yearly: "年卡",
};

export const LEVEL_NAMES: Record<MemberLevel, string> = {
  bronze: "铜卡会员",
  silver: "银卡会员",
  gold: "金卡会员",
  diamond: "钻石会员",
};

export const STATUS_NAMES: Record<MemberStatus, string> = {
  active: "正常",
  expired: "已过期",
  frozen: "已冻结",
};

// 交易相关类型
export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  sessions?: number;
  pointsUsed?: number;
  pointsEarned?: number;
  balanceBefore: number;
  balanceAfter: number;
  operator: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType = "recharge" | "consume" | "refund";
export type PaymentMethod =
  "cash" | "wechat" | "alipay" | "card" | "other" | "balance";

export const TRANSACTION_TYPE_NAMES: Record<TransactionType, string> = {
  recharge: "充值",
  consume: "消费",
  refund: "退款",
};

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  balance: "账户余额",
  cash: "现金",
  wechat: "微信",
  alipay: "支付宝",
  card: "银行卡",
  other: "其他",
};

// 预约相关类型
export interface Appointment {
  id: string;
  memberId: string;
  memberName: string;
  courseId: string;
  courseName: string;
  appointmentTime: string;
  duration: number;
  coach?: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  "pending" | "confirmed" | "completed" | "cancelled";

export const APPOINTMENT_STATUS_NAMES: Record<AppointmentStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
};

export interface AppData {
  members: Member[];
  transactions: Transaction[];
  appointments: Appointment[];
}
export interface Backup {
  id: string;
  version: string;
  timestamp: string;
  data: AppData;
}
export interface TransactionInput {
  memberId: string;
  type: "recharge" | "consume";
  amount: number;
  paymentMethod: PaymentMethod;
  sessions?: number;
  notes?: string;
}
