"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-slate-600 hover:text-slate-950"
    >
      Sair
    </button>
  );
}
