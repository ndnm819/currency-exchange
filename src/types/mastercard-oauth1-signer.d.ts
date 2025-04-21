declare module 'mastercard-oauth1-signer' {
  export function getBaseString(
    method: string,
    baseUrl: string,
    queryParams: Record<string, string>,
    bodyParams: Record<string, string>
  ): string;

  export function getSignature(
    baseString: string,
    signingKey: string
  ): string;

  export function getAuthorizationHeader(
    uri: string,
    method: string,
    payload: any,
    consumerKey: string,
    signingKey: string
  ): string;
} 