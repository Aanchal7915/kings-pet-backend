const Booking = require('../models/Booking');

const toDateRange = (from, to) => {
  const start = from ? new Date(from) : new Date('1970-01-01');
  const end = to ? new Date(to) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const { start, end } = toDateRange(from, to);
    const dateMatch = { createdAt: { $gte: start, $lte: end } };

    const [totals, statusCounts, byDate, topServices, recent] = await Promise.all([
      Booking.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            confirmed: {
              $sum: {
                $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0],
              },
            },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0],
              },
            },
            advanceCollected: { $sum: '$advancePaid' },
            refunded: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$advancePaid', 0],
              },
            },
          },
        },
      ]),
      Booking.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            bookings: { $sum: 1 },
            advance: { $sum: '$advancePaid' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$service.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Booking.find(dateMatch)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('slot', 'date startTime endTime'),
    ]);

    const totalsRow = totals[0] || {
      totalBookings: 0,
      confirmed: 0,
      completed: 0,
      advanceCollected: 0,
      refunded: 0,
    };

    const completionRate = totalsRow.totalBookings
      ? Number(((totalsRow.completed / totalsRow.totalBookings) * 100).toFixed(2))
      : 0;

    const statusMap = {
      confirmed: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      cancelled_refunded: 0,
    };
    statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBookings: totalsRow.totalBookings,
        confirmed: totalsRow.confirmed,
        completed: totalsRow.completed,
        advanceCollected: totalsRow.advanceCollected,
        refunded: totalsRow.refunded,
        completionRate,
        bookingsOverTime: byDate.map((item) => ({ date: item._id, count: item.bookings })),
        advanceOverTime: byDate.map((item) => ({ date: item._id, amount: item.advance })),
        byStatus: statusMap,
        topServices: topServices.map((item) => ({ name: item._id || 'Unknown', count: item.count })),
        recentBookings: recent,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
