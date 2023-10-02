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
      console.log(chosenEmployee.maxTours);
      chosenEmployee.assignedTours.push(tour.id);
      const chosenBus = availableBuses[0];
      schedule.push({ tour, employee: chosenEmployee, bus: chosenBus });
      chosenBus.capacity--;
    }
  }
  
  // Allow Employee 1 to reassign the first tour (if desired)
  const employeeToReassign = employees.find((employee) => employee.id === 1);
  if (employeeToReassign) {
    const tourToReassign = employeeToReassign.assignedTours.shift(); // Remove the first assigned tour
    const reassignedTour = schedule.find((assignment) => assignment.tour.id === tourToReassign);
    if (reassignedTour) {
      const newTour = tours.find((tour) => tour.id === 1); // Choose a different tour to reassign to
      if (newTour) {
        reassignedTour.tour = newTour;
        employeeToReassign.assignedTours.push(newTour.id);
      }
    }
  }
  
  // Print the resulting schedule
  console.log("Shift Schedule:");
  for (const assignment of schedule) {
    console.log(
      `Tour ${assignment.tour.id} at ${assignment.tour.dateTime.toISOString()} assigned to ${assignment.employee.name} on Bus ${assignment.bus.id}`
    );
  }