"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LoginParams = {
    email: string;
    password: string;
};

export async function login({
    email,
    password,
}: LoginParams): Promise<{ error: string } | never> {
    const supabase = await createClient();

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Query public.users to determine dashboard redirect
    const { data: profile } = await supabase
        .from("users")
        .select("type")
        .eq("id", data.user.id)
        .single();

    const userType = profile?.type ?? "buyer";

    redirect(userType === "farmer" ? "/farmer" : "/buyer");
}
