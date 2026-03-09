"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserType } from "@/types/User";

type SignupParams = {
    name: string;
    email: string;
    password: string;
    type: UserType;
    businessName: string;
    phone: string;
};

export async function signup({
    name,
    email,
    password,
    type,
    businessName,
    phone,
}: SignupParams): Promise<{ error: string } | never> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                type,
                business_name: businessName,
                phone,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
        return { error: "Signup succeeded but no user ID was returned." };
    }

    // Insert profile row into public.users
    const { error: profileError } = await supabase.from("users").insert({
        id: userId,
        name,
        email,
        type,
        business_name: businessName,
        phone,
    });

    if (profileError) {
        return { error: profileError.message };
    }

    redirect(type === "farmer" ? "/farmer" : "/buyer");
}
