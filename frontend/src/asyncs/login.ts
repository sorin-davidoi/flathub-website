import { ParsedUrlQuery } from "querystring"
import { Dispatch } from "react"
import {
  LOGIN_PROVIDERS_URL,
  LOGOUT_URL,
  USER_DELETION_URL,
  USER_INFO_URL,
} from "../env"
import { UserStateAction } from "../types/Login"

/**
 * Performs the callback POST request to check 3rd party authentication
 * was successful. Fetches user data on success. Throws localized string
 * ID on error.
 * @param dispatch Reducer dispatch function used to update user context
 * @param query URL query object with code and state to POST to backend
 * as well as login provider name to determine the API endpoint
 */
export async function login(
  dispatch: Dispatch<UserStateAction>,
  query: ParsedUrlQuery,
) {
  dispatch({ type: "loading" })

  let res: Response
  try {
    res = await fetch(`${LOGIN_PROVIDERS_URL}/${query.service}`, {
      method: "POST",
      credentials: "include", // Must use the session cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: query.code,
        state: query.state,
      }),
    })
  } catch {
    dispatch({ type: "interrupt" })
    throw "network-error-try-again"
  }

  if (res.ok) {
    getUserData(dispatch)
  } else {
    dispatch({ type: "interrupt" })

    // Some errors come with an explanation from backend, others are unexpected
    const data = await res.json()

    const msg = {
      "User already logged in?": "error-already-logged-in",
    }[data.error]

    throw msg ?? "network-error-try-again"
  }
}

/**
 * Retrieved the currently logged in user's data. On error the state of
 * current data is assumed to be unchanged.
 * @param dispatch Reducer dispatch function used to update user context
 */
export async function getUserData(dispatch: Dispatch<UserStateAction>) {
  // Indicate the user data is being fetched
  dispatch({ type: "loading" })

  // On network error just assume user state is unchanged
  let res: Response
  try {
    // Gets data for user with current session cookie
    res = await fetch(USER_INFO_URL, { credentials: "include" })
  } catch {
    dispatch({ type: "interrupt" })
    return
  }

  // Assuming a bad status indicates unchanged user state
  if (res.ok) {
    const info = await res.json()
    dispatch({
      type: "login",
      info,
    })
  } else {
    // 403 specifically indicates not currently logged in
    dispatch({ type: res.status === 403 ? "logout" : "interrupt" })
  }
}

/**
 * Performs the logout API action and updates the client-side context.
 * Throws localized string ID on error.
 * @param dispatch Reducer dispatch function used to update user context
 */
export async function logout(dispatch: Dispatch<UserStateAction>) {
  dispatch({ type: "loading" })

  let res: Response
  try {
    res = await fetch(LOGOUT_URL, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    dispatch({ type: "interrupt" })
    throw "network-error-try-again"
  }

  if (res.ok) {
    dispatch({ type: "logout" })
  } else {
    dispatch({ type: "interrupt" })
    throw "network-error-try-again"
  }
}

/**
 * Performs a POST request to the API to complete user deletion.
 * Throws localized string ID on error.
 * @param dispatch Reducer dispatch function used to update user context
 * @param token The string token returned by deletion initiation request
 */
export async function deleteAccount(
  dispatch: Dispatch<UserStateAction>,
  token: string,
) {
  let res: Response
  try {
    res = await fetch(USER_DELETION_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  } catch {
    throw "network-error-try-again"
  }

  if (res.ok) {
    const data = await res.json()
    if (data.status === "ok") {
      dispatch({ type: "logout" })
    } else {
      const msg = {
        // TODO: Link backend responses to translated strings where desired
      }[data.error]

      throw msg ?? "network-error-try-again"
    }
  } else {
    throw "network-error-try-again"
  }
}
