export type UserType = "buyer" | "farmer";

export type User = {
    id: string;
    name: string;
    email: string;
    type: UserType;
    businessName: string;
    phone: string;
};
