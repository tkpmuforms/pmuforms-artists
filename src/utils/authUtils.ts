import { Dispatch } from "@reduxjs/toolkit";
import { getAuthMe } from "../services/artistServices";
import { setUser } from "../redux/auth";

/**
 * Refreshes the authenticated user data from the server and updates Redux store
 *
 * Use this after any operation that changes user subscription status or permissions
 * (e.g., after successful payment, subscription upgrade, plan changes)
 *
 * @param dispatch - Redux dispatch function from useDispatch()
 * @returns Promise that resolves when user data is refreshed
 *
 * @example
 * import { useDispatch } from 'react-redux';
 * import { refreshAuthUser } from '../utils/authUtils';
 *
 * const dispatch = useDispatch();
 *
 * // After payment success
 * await refreshAuthUser(dispatch);
 */
export const refreshAuthUser = async (dispatch: Dispatch): Promise<void> => {
  try {
    const response = await getAuthMe();
    if (response?.data?.user) {
      dispatch(setUser(response.data.user));
    }
  } catch (error) {
    console.error("Error refreshing auth user:", error);
    throw error; // Re-throw to allow caller to handle errors
  }
};
