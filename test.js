// Define tours, employees, and buses with datetime information
// const tours = [
//   { id: 1, dateTime: new Date("2023-10-02T08:00:00"), duration: 4 },
//   { id: 2, dateTime: new Date("2023-10-02T12:00:00"), duration: 4 },
//   { id: 3, dateTime: new Date("2023-10-03T08:00:00"), duration: 4 },
//   { id: 4, dateTime: new Date("2023-10-03T12:00:00"), duration: 4 },
//   { id: 5, dateTime: new Date("2023-10-03T09:00:00"), duration: 4 },
//   { id: 6, dateTime: new Date("2023-10-02T11:00:00"), duration: 4 },
//   { id: 7, dateTime: new Date("2023-10-02T15:00:00"), duration: 4 },
//   { id: 8, dateTime: new Date("2023-10-03T14:00:00"), duration: 4 },
// ];

// const employees = [
//   { id: 1, name: "Employee 1", maxTours: 2, assignedTours: [] },
//   { id: 2, name: "Employee 2", maxTours: 2, assignedTours: [] },
//   { id: 3, name: "Employee 3", maxTours: 2, assignedTours: [] },
// ];

// const buses = [
//   { id: 1, capacity: 20 },
//   { id: 2, capacity: 20 },
//   { id: 3, capacity: 20 },
//   { id: 4, capacity: 20 },
//   { id: 5, capacity: 20 },
//   { id: 6, capacity: 20 },
//   { id: 7, capacity: 20 },
// ];

// // Initialize the schedule
// const schedule = [];

// // Sort tours by datetime (ascending order)
// tours.sort((a, b) => a.dateTime - b.dateTime);

// // Assign tours to employees while respecting constraints
// for (const tour of tours) {
//   // Find an available employee for the tour
//   const availableEmployees = employees.filter(
//     (employee) =>
//       employee.maxTours > 0 &&
//       !employee.assignedTours.includes(tour.id)
//     // && !schedule.some((assignment) => assignment.employee.id === employee.id)
//     // && assignment.bus.capacity >= 1
//   );

//   const availableBuses = buses.filter(
//     (bus) =>
//       bus.capacity >= 1 &&
//       !schedule.some((assignment) => assignment.bus.id === bus.id)
//   );

//   if (availableEmployees.length > 0 && availableBuses.length > 0) {
//     const chosenEmployee = availableEmployees[0];
//     chosenEmployee.maxTours--;
//     // console.log(chosenEmployee.maxTours);
//     chosenEmployee.assignedTours.push(tour.id);
//     const chosenBus = availableBuses[0];
//     schedule.push({ tour, employee: chosenEmployee, bus: chosenBus });
//     chosenBus.capacity--;
//   }
// }

// // Print the resulting schedule
// console.log("Shift Schedule:");
// for (const assignment of schedule) {
//   console.log(
//     `Tour ${assignment.tour.id} at ${assignment.tour.dateTime.toISOString()} assigned to ${assignment.employee.name} on Bus ${assignment.bus.id}`
//   );
// }







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
//               accessKey: accessKey,
//               requestId: 'MOMO1696254661144',
//               amount: amount,
//               orderId: 'MOMO1696254661144',
//               orderInfo: orderInfo,
//               redirectUrl: redirectUrl,
//               ipnUrl: ipnUrl,
//               extraData: extraData,
//               requestType: requestType,
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

// const findScheduledTourGuild = await db.Tour.findAll({
//   raw: true, nest: true,
//   order: [['departureDate', 'ASC']],
//   where: {
//     departureDate: {
//       [Op.gte]: currentDate,
//     },
//     isScheduled: true,
//     tourGuideId: body.tourGuideId
//   },
// })

// const findScheduledDriver = await db.Tour.findAll({
//   raw: true, nest: true,
//   order: [['departureDate', 'ASC']],
//   where: {
//     departureDate: {
//       [Op.gte]: currentDate,
//     },
//     isScheduled: true,
//     driverId: body.driverId
//   },
// })

// const findTour = await db.Tour.findOne({
//   raw: true, nest: true,
//   where: {
//     tourId: tourId
//   },
// })

// // Find an available employee for the tour
// findScheduledTourGuild.some((assignment) => {
//   const departureDate = new Date(assignment.departureDate);
//   // Split the duration string into hours, minutes, and seconds
//   const [hours, minutes, seconds] = assignment.duration.split(':').map(Number);

//   // Add the duration to the departureDate
//   departureDate.setHours(departureDate.getHours() + hours);
//   departureDate.setMinutes(departureDate.getMinutes() + minutes);
//   departureDate.setSeconds(departureDate.getSeconds() + seconds);
//   const endDate = departureDate;

//   // Check if the tour guide is available
//   return endDate >= findTour.departureDate
// })

// findScheduledDriver.some((assignment) => {
//   const departureDate = new Date(assignment.departureDate);
//   // Split the duration string into hours, minutes, and seconds
//   const [hours, minutes, seconds] = assignment.duration.split(':').map(Number);

//   // Add the duration to the departureDate
//   departureDate.setHours(departureDate.getHours() + hours);
//   departureDate.setMinutes(departureDate.getMinutes() + minutes);
//   departureDate.setSeconds(departureDate.getSeconds() + seconds);
//   const endDate = departureDate;

//   // Check if the tour guide is available
//   return endDate >= findTour.departureDate
// })




// redisClient.keys('*tours_*', (error, keys) => {
//     if (error) {
//         console.error('Error retrieving keys:', error)
//         return
//     }
//     // Insert new tour into each key individually
//     keys.forEach((key) => {
//         redisClient.get(key, (error, tour) => {
//             if (error) {
//                 console.error(`Error getting key ${key}:`, error)
//             } else {
//                 // console.log(`Key ${key} deleted successfully`)
//                 let arrayTours = JSON.parse(tour)
//                 let newArrayTour = [createTour[0].dataValues, ...arrayTours]
//                 redisClient.setEx(key, 3600, JSON.stringify(newArrayTour))
//             }
//         })
//     })
// })



// const a = 'e789c93e-1ae9-4ede-9d63-3b195b08cb74';
// const b = 'fb199682-4fa7-4465-982c-8473aba4fd55';

// if (a === b) {
//     console.log('The strings are equal.');
// } else {
//     console.log('The strings are not equal.');
// }

// (endDate >= beforeCurrentTourDepartureDate && beforeDepartureDate >= existingTour.departureDate &&
//     existingTour.tourGuide.userId === employee.userId) ||
//     (currentEndDate >= existingTour.departureDate && existingTour.departureDate >= beforeDepartureDate &&
//     existingTour.tourGuide.userId === employee.userId)


// //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
// //parameters
// var partnerCode = "MOMO";
// var accessKey = "F8BBA842ECF85";
// var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
// var requestId = partnerCode + new Date().getTime();
// var orderId = requestId;
// var orderInfo = "pay with MoMo";
// var redirectUrl = "https://momo.vn/return";
// var ipnUrl = "https://callback.url/notify";
// // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
// var amount = "10000";
// var requestType = "captureWallet"
// var extraData = ""; //pass empty value if your merchant does not have stores

// //before sign HMAC SHA256 with format
// //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
// var rawSignature = "accessKey="+accessKey+"&amount=" + amount+"&extraData=" + extraData+"&ipnUrl=" + ipnUrl+"&orderId=" + orderId+"&orderInfo=" + orderInfo+"&partnerCode=" + partnerCode +"&redirectUrl=" + redirectUrl+"&requestId=" + requestId+"&requestType=" + requestType
// //puts raw signature
// console.log("--------------------RAW SIGNATURE----------------")
// console.log(rawSignature)
// //signature
// const crypto = require('crypto');
// var signature = crypto.createHmac('sha256', secretkey)
//     .update(rawSignature)
//     .digest('hex');
// console.log("--------------------SIGNATURE----------------")
// console.log(signature)

// //json object send to MoMo endpoint
// const requestBody = JSON.stringify({
//     partnerCode : partnerCode,
//     accessKey : accessKey,
//     requestId : requestId,
//     amount : amount,
//     orderId : orderId,
//     orderInfo : orderInfo,
//     redirectUrl : redirectUrl,
//     ipnUrl : ipnUrl,
//     extraData : extraData,
//     requestType : requestType,
//     signature : signature,
//     lang: 'en'
// });
// //Create the HTTPS objects
// const https = require('https');
// const options = {
//     hostname: 'test-payment.momo.vn',
//     port: 443,
//     path: '/v2/gateway/api/create',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': Buffer.byteLength(requestBody)
//     }
// }
// //Send the request and get the response
// const req = https.request(options, res => {
//     console.log(`Status: ${res.statusCode}`);
//     console.log(`Headers: ${JSON.stringify(res.headers)}`);
//     res.setEncoding('utf8');
//     res.on('data', (body) => {
//         console.log('Body: ');
//         console.log(body);
//         console.log('payUrl: ');
//         console.log(JSON.parse(body).payUrl);
//     });
//     res.on('end', () => {
//         console.log('No more data in response.');
//     });
// })

// req.on('error', (e) => {
//     console.log(`problem with request: ${e.message}`);
// });
// // write data to request body
// console.log("Sending....")
// req.write(requestBody);
// req.end();




// *       - name: tourStatus
// *         in: query
// *         schema:
// *           type: string
// *           enum: ["Available", "Started", "Canceled", "Finished"]
// *         description: Find tour by tour status



// {
//     "tourName": "Chuyến đi tham quan buổi sáng",
//     "description": "Một chuyến đi tuyệt vời",
//     "duration": "02:00:00",
//     "distance": 10.5,
//     "geoJson": {
//       "type": "Feature",
//       "geometry": {
//         "type": "LineString",
//         "coordinates": [
//           [
//             "109.189296",
//             "12.247460"
//           ],
//           [
//             "109.194145",
//             "12.250605"
//           ],
//           [
//             "109.189296",
//             "12.247460"
//           ]
//         ]
//       },
//       "properties": {
//         "name": "Route between Stations"
//       }
//     },
//     "segments": [
//       {
//         "departureStationId": "0aeaf58d-cea9-497f-a40a-9308c9705dbe",
//         "endStationId": "0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3",
//         "distance": 100.2,
//         "points": [
//           "4ce2f788-067a-4032-9c53-113c1aaaa638"
//         ]
//       },
//       {
//         "departureStationId": "0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3",
//         "endStationId": "52cd4ad3-4494-403a-b8cc-b82777aa68dc",
//         "distance": 410.3,
//         "points": [
//           "42cfe90e-b32a-406a-9603-8bbeafbb7e8b"
//         ]
//       },
//   {
//         "departureStationId": "52cd4ad3-4494-403a-b8cc-b82777aa68dc",
//         "endStationId": "0aeaf58d-cea9-497f-a40a-9308c9705dbe",
//         "distance": 410.3,
//         "points": [
//           "42cfe90e-b32a-406a-9603-8bbeafbb7e8b"
//         ]
//       }
//     ],
//     "tickets": [
//       "3355c24a-741c-4e3b-9d2a-fa43c4c950c5",
//       "99f73c58-7c81-4152-90f9-21e50637e9c8"
//     ],
//     "schedules": [
//       {
//         "departureDate": "2023-12-28T09:00:00Z",
//         "departureStationId": "0aeaf58d-cea9-497f-a40a-9308c9705dbe"
//       },
//       {
//         "departureDate": "2023-12-29T09:00:00Z",
//         "departureStationId": "0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3"
//       },
//   {
//         "departureDate": "2023-12-29T11:00:00Z",
//         "departureStationId": "52cd4ad3-4494-403a-b8cc-b82777aa68dc"
//       }
//     ],
//     "images": [
//       "https://cdn.tuoitre.vn/471584752817336320/2023/4/18/tp-nha-trang-16818161974101240202452.jpeg"
//     ]
//   }


// const { sortRouteSegmentByDepartureStation } = require("./utils/SortRouteSegmentUlti");

// const data = [
//     {
//       routeSegmentId: '2b59e97c-b3f9-44af-9df4-888524eb39d2',
//       tourId: 'fc9b54d2-ce00-450f-b882-d00bbc1f93cf',
//       departureStationId: '0aeaf58d-cea9-497f-a40a-9308c9705dbe',
//       endStationId: '0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3',
//       distance: 100.2
//     },
//     {
//       routeSegmentId: '942096a1-1178-46aa-86b2-ab373e317705',
//       tourId: 'fc9b54d2-ce00-450f-b882-d00bbc1f93cf',
//       departureStationId: '52cd4ad3-4494-403a-b8cc-b82777aa68dc',
//       endStationId: '0aeaf58d-cea9-497f-a40a-9308c9705dbe',
//       distance: 410.3
//     },
//     {
//       routeSegmentId: 'e4317637-3abf-45de-9d85-6c5c91d03fcc',
//       tourId: 'fc9b54d2-ce00-450f-b882-d00bbc1f93cf',
//       departureStationId: '0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3',
//       endStationId: '52cd4ad3-4494-403a-b8cc-b82777aa68dc',
//       distance: 410.3
//     }
//   ]

//   const data2 = [
//     {
//       departureStationId: '0aeaf58d-cea9-497f-a40a-9308c9705dbe',
//       endStationId: '0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3',
//       distance: 100.2,
//       points: [
//         '4ce2f788-067a-4032-9c53-113c1aaaa638'
//       ]
//     },
//     {
//         departureStationId: '52cd4ad3-4494-403a-b8cc-b82777aa68dc',
//         endStationId: '0aeaf58d-cea9-497f-a40a-9308c9705dbe',
//         distance: 410.3,
//         points: [
//           '42cfe90e-b32a-406a-9603-8bbeafbb7e8b'
//         ]
//       },
//     {
//       departureStationId: '0fb1c1e2-81a4-4ade-bb62-9a52bef8a4f3',
//       endStationId: '52cd4ad3-4494-403a-b8cc-b82777aa68dc',
//       distance: 410.3,
//       points: [
//         '42cfe90e-b32a-406a-9603-8bbeafbb7e8b'
//       ]
//     }
//   ]

// const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(data, '52cd4ad3-4494-403a-b8cc-b82777aa68dc');
// const routeSegmentsSortByDepartureStation2 = sortRouteSegmentByDepartureStation(data2, '52cd4ad3-4494-403a-b8cc-b82777aa68dc');

// console.log('routeSegmentsSortByDepartureStation', routeSegmentsSortByDepartureStation);
// console.log('routeSegmentsSortByDepartureStation2', routeSegmentsSortByDepartureStation2);