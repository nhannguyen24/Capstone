// Define tours, employees, and buses with datetime information
const tours = [
    { id: 1, dateTime: new Date("2023-10-02T08:00:00"), duration: 4 },
    { id: 2, dateTime: new Date("2023-10-02T12:00:00"), duration: 4 },
    { id: 3, dateTime: new Date("2023-10-03T08:00:00"), duration: 4 },
    { id: 4, dateTime: new Date("2023-10-03T12:00:00"), duration: 4 },
    { id: 5, dateTime: new Date("2023-10-03T09:00:00"), duration: 4 },
    { id: 6, dateTime: new Date("2023-10-02T11:00:00"), duration: 4 },
    { id: 7, dateTime: new Date("2023-10-02T15:00:00"), duration: 4 },
    { id: 8, dateTime: new Date("2023-10-03T14:00:00"), duration: 4 },
  ];
  
  const employees = [
    { id: 1, name: "Employee 1", maxTours: 2, assignedTours: [] },
    { id: 2, name: "Employee 2", maxTours: 2, assignedTours: [] },
    { id: 3, name: "Employee 3", maxTours: 2, assignedTours: [] },
  ];
  
  const buses = [
    { id: 1, capacity: 20 },
    { id: 2, capacity: 20 },
    { id: 3, capacity: 20 },
    { id: 4, capacity: 20 },
    { id: 5, capacity: 20 },
    { id: 6, capacity: 20 },
    { id: 7, capacity: 20 },
  ];
  
  // Initialize the schedule
  const schedule = [];
  
  // Sort tours by datetime (ascending order)
  tours.sort((a, b) => a.dateTime - b.dateTime);
  
  // Assign tours to employees while respecting constraints
  for (const tour of tours) {
    // Find an available employee for the tour
    const availableEmployees = employees.filter(
      (employee) =>
        employee.maxTours > 0 &&
        !employee.assignedTours.includes(tour.id) 
        // && !schedule.some((assignment) => assignment.employee.id === employee.id) 
        // && assignment.bus.capacity >= 1
    );
  
    const availableBuses = buses.filter(
      (bus) =>
        bus.capacity >= 1 &&
        !schedule.some((assignment) => assignment.bus.id === bus.id)
    );
  
    if (availableEmployees.length > 0 && availableBuses.length > 0) {
      const chosenEmployee = availableEmployees[0];
      chosenEmployee.maxTours--;
      // console.log(chosenEmployee.maxTours);
      chosenEmployee.assignedTours.push(tour.id);
      const chosenBus = availableBuses[0];
      schedule.push({ tour, employee: chosenEmployee, bus: chosenBus });
      chosenBus.capacity--;
    }
  }
  
  // Print the resulting schedule
  console.log("Shift Schedule:");
  for (const assignment of schedule) {
    console.log(
      `Tour ${assignment.tour.id} at ${assignment.tour.dateTime.toISOString()} assigned to ${assignment.employee.name} on Bus ${assignment.bus.id}`
    );
  }









//   const tours = [
//     { tourId: 1, departureDate: new Date("2023-10-02T08:00:00"), duration: "03:00:00" },
//     { tourId: 2, departureDate: new Date("2023-10-02T08:00:00"), duration: "03:00:00" },
//     { tourId: 3, departureDate: new Date("2023-10-03T08:00:00"), duration: "03:00:00" },
//     { tourId: 4, departureDate: new Date("2023-10-03T12:00:00"), duration: "03:00:00" },
//     { tourId: 5, departureDate: new Date("2023-10-03T09:00:00"), duration: "03:00:00" },
//     { tourId: 6, departureDate: new Date("2023-10-02T11:00:00"), duration: "03:00:00" },
//     { tourId: 7, departureDate: new Date("2023-10-02T09:00:00"), duration: "03:00:00" },
//     { tourId: 8, departureDate: new Date("2023-10-03T14:00:00"), duration: "03:00:00" },
// ];

// tours.sort((a, b) => a.departureDate - b.departureDate);

// const findTourguide = [
//     { tourGuideId: 1, name: "Tourguide 1", maxTours: 3 },
//     { tourGuideId: 2, name: "Tourguide 2", maxTours: 3 },
//     { tourGuideId: 3, name: "Tourguide 3", maxTours: 3 },
// ];

// const findDriver = [
//     { driverId: 1, name: "Driver 1", maxTours: 3 },
//     { driverId: 2, name: "Driver 2", maxTours: 3 },
// ];

// const buses = [
//     { busId: 1, numberSeat: 20 },
//     { busId: 2, numberSeat: 20 },
//     { busId: 3, numberSeat: 20 },
//     { busId: 4, numberSeat: 20 },
//     { busId: 5, numberSeat: 20 },
//     { busId: 6, numberSeat: 20 },
//     { busId: 7, numberSeat: 20 },
//     { busId: 8, numberSeat: 20 },
// ];









    // Allow Employee 1 to reassign the first tour (if desired)
  // const employeeToReassign = employees.find((employee) => employee.id === 1);
  // if (employeeToReassign) {
  //   const tourToReassign = employeeToReassign.assignedTours.shift(); // Remove the first assigned tour
  //   const reassignedTour = schedule.find((assignment) => assignment.tour.id === tourToReassign);
  //   if (reassignedTour) {
  //     const newTour = tours.find((tour) => tour.id === 1); // Choose a different tour to reassign to
  //     if (newTour) {
  //       reassignedTour.tour = newTour;
  //       employeeToReassign.assignedTours.push(newTour.id);
  //     }
  //   }
  // }



  // const createMoMoPaymentRequest = (amounts) =>
  //   new Promise(async (resolve, reject) => {
  //       try {
  //           //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //           //parameters
  //           var partnerCode = "MOMO";
  //           var accessKey = "F8BBA842ECF85";
  //           var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  //           var requestId = partnerCode + new Date().getTime();
  //           var orderId = requestId;
  //           var orderInfo = "Pay with MoMo";
  //           var redirectUrl = "https://nbtour-fc9f59891cf4.herokuapp.com/api-docs/#/";
  //           var ipnUrl = "https://nbtour-fc9f59891cf4.herokuapp.com/api-docs/#/";
  //           // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
  //           var amount = amounts;
  //           var requestType = "captureWallet"
  //           var extraData = ""; //pass empty value if your merchant does not have stores

  //           //before sign HMAC SHA256 with format
  //           //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
  //           var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
  //           //puts raw signature
  //           console.log("--------------------RAW SIGNATURE----------------")
  //           console.log(rawSignature)
  //           //signature
  //           const crypto = require('crypto');
  //           var signature = crypto.createHmac('sha256', secretkey)
  //               .update(rawSignature)
  //               .digest('hex');
  //           console.log("--------------------SIGNATURE----------------")
  //           console.log(signature)

  //           //json object send to MoMo endpoint
  //           const requestBody = JSON.stringify({
  //               partnerCode: 'MOMO',
  //               // accessKey: accessKey,
  //               requestId: 'MOMO1696254661144',
  //               // amount: amount,
  //               orderId: 'MOMO1696254661144',
  //               // orderInfo: orderInfo,
  //               // redirectUrl: redirectUrl,
  //               // ipnUrl: ipnUrl,
  //               // extraData: extraData,
  //               // requestType: requestType,
  //               signature: '17cc8285ccfbe104352c37caaaf8fee2b06d5078a05b154364f9918a2a052dd4',
  //               lang: 'en'
  //           });
  //           //Create the HTTPS objects
  //           const https = require('https');
  //           const options = {
  //               hostname: 'test-payment.momo.vn',
  //               port: 443,
  //               path: '/v2/gateway/api/query',
  //               method: 'POST',
  //               headers: {
  //                   'Content-Type': 'application/json',
  //                   'Content-Length': Buffer.byteLength(requestBody)
  //               }
  //           }

  //           //Send the request and get the response
  //           const req = https.request(options, res => {
  //               // console.log(`Status: ${res.statusCode}`);
  //               // console.log(`Headers: ${JSON.stringify(res.headers)}`);
  //               res.setEncoding('utf8');
  //               res.on('data', (body) => {
  //                   // console.log('Body: ');
  //                   // console.log(body);
  //                   // console.log('payUrl: ');
  //                   // console.log(JSON.parse(body).payUrl);
  //                   // resolve({
  //                   //     status: 200,
  //                   //     data: {
  //                   //         msg: "Get link payment successfully!",
  //                   //         url: JSON.parse(body).payUrl,
  //                   //     }
  //                   // });
  //                   console.log(JSON.parse(body));
  //               });
  //               res.on('end', () => {
  //                   console.log('No more data in response.');
  //               });
  //           })

  //           req.on('error', (e) => {
  //               console.log(`problem with request: ${e.message}`);
  //           });

  //           // write data to request body
  //           console.log("Sending....")
  //           req.write(requestBody);
  //           req.end();
  //       } catch (error) {
  //           reject(error);
  //       }
  //   });