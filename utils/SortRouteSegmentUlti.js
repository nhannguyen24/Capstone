const sortRouteSegmentByDepartureStation = (data, departureStationId) => {
    // Find the index of the object with the given departureStationId
    const index = data.findIndex(item => item.departureStationId === departureStationId);
  
    // If the departureStationId is found, create a new array starting from that index
    // Concatenate the array from the found index with the array before the found index
    const sortedData = index !== -1
      ? data.slice(index).concat(data.slice(0, index))
      : data;
  
    return sortedData;
  }

module.exports = {sortRouteSegmentByDepartureStation}