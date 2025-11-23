const paginate = async (model, page = 1, limit = 10, filter = {}, projection = null, populate = null) => {
  const skip = (page - 1) * limit;

  const query = model.find(filter, projection)
                     .skip(skip)
                     .limit(limit)
                     .sort({ createdAt: -1 });

  if (populate) {
    query.populate(populate);
  }

  const results = await query;
  const totalItems = await model.countDocuments(filter);

  return {
    results,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
  };
};

module.exports = paginate;
