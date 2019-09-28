import {Document, DocumentQuery} from 'mongoose';

const calculateSkip = (pageQuery: string | number, limitQuery: string | number) => {
    const page = +pageQuery || 1;
    const limit = +limitQuery || 100;
    return (page - 1) * limit;
};

class APIFeatures<T extends Document> {
    public query: DocumentQuery<T[], T>;
    private queryString: any;

    constructor(query: DocumentQuery<T[], T>, queryString: any) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const limit = +this.queryString.limit || 100;
        const skip = calculateSkip(this.queryString.page, this.queryString.limit);

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

export default APIFeatures;
