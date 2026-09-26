"use client";

import { useCallback, useMemo } from "react";
import { selectUser } from "@/lib/db";
import * as authService from "@/services/auth.service";
import * as userService from "@/services/user.service";
import type { Credentials, RegisterInput } from "@/types/user";
import type { ProfileValues, ChangePasswordValues } from "@/validation/account.schema";
import { useAppState } from "./useAppState";

export function useAuth() {
  const state = useAppState();
  const user = useMemo(() => selectUser(state), [state]);

  const enquiries = useMemo(
    () =>
      user ? state.enquiries.filter((enquiry) => enquiry.email === user.email) : [],
    [state.enquiries, user],
  );

  const register = useCallback(
    (input: RegisterInput) => authService.register(input),
    [],
  );
  const login = useCallback(
    (credentials: Credentials) => authService.login(credentials),
    [],
  );
  const logout = useCallback(() => authService.logout(), []);
  const verifyPassword = useCallback(
    (password: string) => authService.verifyPassword(password),
    [],
  );
  const changePassword = useCallback(
    (values: ChangePasswordValues) => authService.changePassword(values),
    [],
  );
  const updateProfile = useCallback(
    (values: ProfileValues) => userService.updateProfile(values),
    [],
  );
  const deleteAccount = useCallback(
    (password: string) => userService.deleteAccount(password),
    [],
  );

  return {
    /** False until localStorage has been read — render skeletons while false. */
    hydrated: state.hydrated,
    user,
    isSignedIn: Boolean(user),
    enquiries,
    register,
    login,
    logout,
    verifyPassword,
    changePassword,
    updateProfile,
    deleteAccount,
  };
}
