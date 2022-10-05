import fetch from "node-fetch";
import jwt from "jsonwebtoken";

export type Receipt = {
  version: "1.0.0";
  type: "INVOICE";
  cash_register: {
    serial_number: string;
  };
  head: {
    id?: string;
    number: string;
    // DateTime RFC 3339
    date: string;
    // DateTime RFC 3339
    delivery_period_start?: string;
    // DateTime RFC 3339
    delivery_period_end?: string;
    seller?: {
      name: string;
      tax_number: string;
      tax_exemption?: boolean;
      tax_exemption_note?: string;
      address: {
        street: string;
        postal_code: string;
        city: string;
        // Three letter country code (ISO 3166-1 alpha-3)
        country_code: string;
      };
    };
    buyer_text?: string;
    buyer?: {
      customer_number?: string;
      name: string;
      tax_number?: string;
      address: {
        street: string;
        postal_code: string;
        city: string;
        // Three letter country code (ISO 3166-1 alpha-3)
        country_code: string;
      };
    };
  };
  data: {
    currency: string;
    full_amount_incl_vat: number;
    payment_types: {
      name: string;
      amount: number;
      foreign_amount?: number;
      foreign_currency?: string;
    }[];
    vat_amounts: {
      percentage: number;
      incl_vat: number;
      excl_vat: number;
      vat: number;
    }[];
    lines: {
      text: string;
      additional_text?: string;
      vat_amounts?: (
        | {
            percentage: number;
            incl_vat: number;
          }
        | {
            percentage: number;
            excl_vat: number;
            vat: number;
          }
      )[];
      item?: {
        // Article number
        number: string;
        gtin?: string;
        quantity: number;
        quantity_measure?: string;
        // Gross Price per Unit
        price_per_unit: number;
      };
      delivery_period_start?: string;
      delivery_period_end?: string;
    }[];
  };
  security?: {
    tse?: {
      serial_number: string;
      signature_algorithm: string;
      log_time_format:
        | "unixTime"
        | "utcTime"
        | "utcTimeWithSeconds"
        | "generalizedTime"
        | "generalizedTimeWithMilliseconds";
      certificate: string;
      timestamp_start: string;
      timestamp_end: string;
      first_order?: string;
      transaction_number: number;
      signature_number: number;
      process_type?: string;
      process_data?: string;
      signature: string;
    };
  };
  misc?: {
    logo?: {
      content_type: string;
      content: string;
    };
    footer_text?: string;
    additional_receipts?: [
      {
        content_type: string;
        content: string;
      }
    ];
  };
};

type CreateReceiptResponseDTO = {
  receipt_id: string;
  view_token: { token: string; expires_at: Date };
  locations: {
    api: { url: string };
    dynamic_link: { url: string; qr_code_svg: string };
  };
};

let credentials:
  | {
      clientId: string;
      clientSecret: string;
    }
  | undefined;
let baseUrl = "https://api.epap.app";
let accessToken: string | undefined;

export function setCredentials(options: {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}) {
  const invalidateAccessToken =
    credentials?.clientId !== options.clientId ||
    credentials?.clientSecret !== options.clientSecret ||
    baseUrl !== options.baseUrl;
  credentials = {
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
  baseUrl = options.baseUrl ?? baseUrl;
  accessToken = invalidateAccessToken ? undefined : accessToken;
}

async function refreshAccessToken(forceRefresh?: boolean) {
  if (!credentials)
    throw new Error("Credentials not set. Please call setCredentials() first.");
  if (accessToken && forceRefresh !== true) {
    const decodedJwt = jwt.decode(accessToken);
    const jwtStillValid =
      decodedJwt &&
      typeof decodedJwt !== "string" &&
      decodedJwt.exp &&
      decodedJwt.exp > Date.now() / 1000;
    if (jwtStillValid) return;
  }

  const response = await fetch(`${baseUrl}/oidc/token`, {
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "client_credentials",
      scope: "create:receipts delete:receipts read:receipts",
    }),
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const responseData = await response.json();
  switch (response.status) {
    case 200: {
      accessToken = responseData.access_token;
      break;
    }
    case 401: {
      throw new Error(
        `Unauthorized: ${responseData.error} - ${responseData.error_description}`
      );
    }
    default: {
      throw new Error("Failed to refresh access token");
    }
  }
}

export async function createReceipt(
  receipt: Receipt
): Promise<CreateReceiptResponseDTO> {
  await refreshAccessToken();
  const response = await fetch(`${baseUrl}/v1/receipts`, {
    body: JSON.stringify(receipt),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const responseData = await response.json();
  switch (response.status) {
    case 200: {
      return {
        receipt_id: responseData.receipt_id,
        view_token: {
          token: responseData.view_token.token,
          expires_at: new Date(responseData.view_token.expires_at),
        },
        locations: {
          api: { url: responseData.locations.api.url },
          dynamic_link: {
            url: responseData.locations.dynamic_link.url,
            qr_code_svg: responseData.locations.dynamic_link.qr_code_svg,
          },
        },
      };
    }
    case 401: {
      await refreshAccessToken(true);
      return await createReceipt(receipt);
    }
    case 402: {
      throw new Error("Free Plan Limit Reached");
    }
    default: {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  }
}
export async function viewReceipt(
  receiptId: string
): Promise<{ receipt: Receipt }> {
  return await viewReceiptUrl(`${baseUrl}/v1/receipts/${receiptId}`);
}

export async function viewReceiptUrl(
  receiptUrl: string
): Promise<{ receipt: Receipt }> {
  await refreshAccessToken();
  const response = await fetch(receiptUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const responseData = await response.json();
  switch (response.status) {
    case 200: {
      return responseData as { receipt: Receipt };
    }
    case 401: {
      await refreshAccessToken(true);
      return await viewReceiptUrl(receiptUrl);
    }
    case 404: {
      throw new Error("Receipt Not Found");
    }
    default: {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  }
}

export async function deleteReceipt(receiptId: string): Promise<void> {
  await refreshAccessToken();
  const response = await fetch(`${baseUrl}/v1/receipts/${receiptId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  switch (response.status) {
    case 204: {
      // success
      return;
    }
    case 401: {
      await refreshAccessToken(true);
      return await deleteReceipt(receiptId);
    }
    case 404: {
      throw new Error("Receipt Not Found");
    }
    default: {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  }
}
