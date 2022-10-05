# Receipt API SDK

Our receipt API allows you to easily create digital receipts for your customers. Your customers can view and download their receipts just by scanning a QR code. Demo Receipt: https://link.epap.app/px5rhjTzqEnpDDss9

## Getting started
API credentials are required to access the API. You can get your API credentials by registering at [epap console](https://console.epap.app) and creating a new receipt project.

## Usage
Install the sdk using `npm i @epap/receipt-api-sdk` or `yarn add @epap/receipt-api-sdk`.

Before making any API calls, you need to specify your credentials using `setCredentials`. You only need to call this function once per runtime.
```typescript
import * as receiptApi from '@epap/receipt-api-sdk'

receiptApi.setCredentials({clientId: "your client id", clientSecret: "your client secret"})
```

**Create Receipt**  
To create a new receipt, you have to specify your receipt data using the EKaBS specification. We've included typescript types to make this process more convenient. 

If you have any questions about this process you can take a look at the
[EKaBS specification](https://dfka.net/wp-content/uploads/2021/04/EKaBS-Elektronischer-Kassen-Beleg-Standard_1.0.0_Stand_14.04.2021.pdf) or contact us.

Once you gathered your receipt data, you can just call `createReceipt` to send the receipt to our API:
```typescript
const createdReceipt = await receiptApi.createReceipt({
    version: "1.0.0",
    type: "INVOICE",
    cash_register: {
        serial_number: "YOUR CASH REGISTER SERIAL NUMBER",
    },
    head: {
        date: new Date().toISOString(),
        number: "YOUR INTERNAL RECEIPT NUMBER",
    },
    data: {
        currency: "EUR",
        full_amount_incl_vat: 3.5,
        payment_types: [
        {
            name: "CASH",
            amount: 3.5,
        },
        ],
        lines: [
        {
            text: "Coffee",
        },
        ],
        vat_amounts: [],
    },
});
```

The returned object will then contain following information:
```jsonc
{
  "receipt_id": "...", // Use this id to access the receipt later on
  "view_token": {
    "token": "...", // This token can be given to a customer. It is valid for one week and can be used to download the receipt without your api credentials.
    "expires_at": "2022-10-04T10:40:54.707Z"
  },
  "locations": {
    "api": {
      "url": "https://api.epap.app/v1/receipts/.../..."
    },
    "dynamic_link": {
      "url": "https://link.epap.app/...", // Opens receipt in web browser or epap app; Give this link to your customer.
      "qr_code_svg": "<svg> ... <\svg>" // QR Code to url
    }
  }
}
```

**View Receipt**  
Use the following code to view a previously created receipt:
```typescript
const receipt = await receiptApi.viewReceipt(receiptId);
```
The format of the returned receipt is compatible with the EKaBS specification. 

*Please use `receiptApi.viewReceiptUrl` if you need to access receipts created by other console receipt projects.*


**Delete Receipt**  
If you need to delete a previously created receipt, you can do that using:
```typescript
await api.deleteReceipt(receiptId)
```
Please keep in mind that deleted receipts cannot be recovered.

## Additional Resources
- [API Docs](https://docs.epap.app)
- [EKaBS specification](https://dfka.net/wp-content/uploads/2021/04/EKaBS-Elektronischer-Kassen-Beleg-Standard_1.0.0_Stand_14.04.2021.pdf)

