const createMoMoPaymentRequest = (amounts) =>
    new Promise(async (resolve, reject) => {
        try {
            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            var partnerCode = "MOMO";
            var accessKey = "F8BBA842ECF85";
            var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = "Pay with MoMo";
            var redirectUrl = "https://www.google.com.vn/?hl=vi";
            var ipnUrl = "https://www.google.com.vn/?hl=vi/momo-ipn";
            var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = amounts;
            var requestType = "captureWallet"
            var extraData = ""; //pass empty value if your merchant does not have stores

            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
            //puts raw signature
            console.log("--------------------RAW SIGNATURE----------------")
            console.log(rawSignature)
            //signature
            const crypto = require('crypto');
            var signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');
            console.log("--------------------SIGNATURE----------------")
            console.log(signature)

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'vi'
            });
            //Create the HTTPS objects
            const https = require('https');
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }

            //Send the request and get the response
            const req = https.request(options, res => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (body) => {
                    // console.log('Body: ');
                    // console.log(body);
                    // console.log('payUrl: ');
                    console.log(JSON.parse(body));
                    resolve({
                        status: 200,
                        data: {
                            msg: "Get link payment successfully!",
                            url: JSON.parse(body).payUrl,
                        }
                    });
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            })

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            // write data to request body
            console.log("Sending....")
            req.write(requestBody);
            req.end();
        } catch (error) {
            reject(error);
        }
    });

module.exports = {createMoMoPaymentRequest};



// partnerCode%3DMOMO%26
// orderId%3DMOMO1696253817889%26
// requestId%3DMOMO1696253817889%26
// amount%3D10000%26
// orderInfo%3DPay%2Bwith%2BMoMo%26
// orderType%3Dmomo_wallet%26
// transId%3D1696253830305%26
// resultCode%3D1006%26
// message%3DTransaction%2Bdenied%2Bby%2Buser.%26
// payType%3D%26
// responseTime%3D1696253830348%26
// extraData%3D%26
// signature%3D6259114550a9d17d8286c05102b7a1b90cdf7c693dbbdb863e1840a7c88b2d23