import { http } from "./http";

import type {
  AdminUser,
} from "../types/auth";


export async function getUsers():
Promise<AdminUser[]> {
  const response =
    await http.get<AdminUser[]>(
      "/users",
    );
  return response.data;
}


export async function resetUserPassword(
  userId: number,
  newPassword: string,
): Promise<void> {
  await http.put(
    `/users/${userId}/password`,
    {
      new_password: newPassword,
    },
  );
}
