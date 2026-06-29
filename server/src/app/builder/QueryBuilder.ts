class QueryBuilder {
  public prismaQuery: any;
  public query: Record<string, any>;
  public modelDelegate: any;

  constructor(modelDelegate: any, query: Record<string, any>) {
    this.modelDelegate = modelDelegate;
    this.query = query;
    this.prismaQuery = {
      where: {},
    };
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: 'insensitive' },
        })),
      };
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    if (Object.keys(queryObj).length > 0) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        ...queryObj,
      };
    }
    return this;
  }

  sort() {
    const sort = this.query.sort as string;
    if (sort) {
      const parts = sort.split(',');
      this.prismaQuery.orderBy = parts.map((part: string) => {
        const desc = part.startsWith('-');
        const field = desc ? part.substring(1) : part;
        return { [field]: desc ? 'desc' : 'asc' };
      });
    } else {
      this.prismaQuery.orderBy = { createdAt: 'desc' };
    }
    return this;
  }

  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;
    return this;
  }

  fields() {
    const fields = this.query.fields as string;
    if (fields) {
      const selectObj: Record<string, boolean> = {};
      fields.split(',').forEach((field) => {
        selectObj[field.trim()] = true;
      });
      this.prismaQuery.select = selectObj;
    }
    return this;
  }

  async execute() {
    return await this.modelDelegate.findMany(this.prismaQuery);
  }

  async countTotal() {
    const total = await this.modelDelegate.count({
      where: this.prismaQuery.where,
    });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
