const sortRouteSegmentByDepartureStation = (routeSegments, departureStationId) => {
  const sortedSegments = []
  const startingSegment = routeSegments.find((segment) => segment.departureStationId === departureStationId)

  if (startingSegment) {
    sortedSegments.push(startingSegment);
    for (let i = 1; i < routeSegments.length; i++) {
      const lastSegment = sortedSegments[sortedSegments.length - 1];
      const nextSegment = routeSegments.find(
        (segment) => segment.departureStationId === lastSegment.endStationId && !sortedSegments.includes(segment)
      )
      if (nextSegment) {
        sortedSegments.push(nextSegment);
      } else {
        break
      }
    }
  }

  return sortedSegments;
}

module.exports = { sortRouteSegmentByDepartureStation }