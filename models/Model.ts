import { pool } from "../db/db_config";
import format from "pg-format";
import { QueryResult } from "pg";
import { queryBindings } from "../types/generalTypes";

type PostgresWhereInterface = "=" | ">" | "<" | ">=" | "<=" | "<>" | "!=";

export class Model {
  private table: string;
  // variable for storing query for when calling methods with chaining options
  private sqlQuery: string;

  private isFirstWhere: boolean;
  // variable for storing all the bindings
  private bindings: queryBindings;
  // optional primary_key i.e if provided will be set to the provided key otherwise will use the tabeName_id notation to find the primary Key
  private primary_key: string | undefined;

  constructor(table: string, primary_key?: string) {
    this.table = table;
    this.sqlQuery = "";
    this.primary_key = primary_key;
    this.isFirstWhere = true;
    this.bindings = {
      selects: [],
      joins: [],
      wheres: [],
    };
  }

  /**
   * @description Method for getting all the records for the current instance of the Model
   * @returns All the records of the table for which this method was called
   */
  all<P = any>(): Promise<P[]> {
    return new Promise<P[]>((resolve, reject) => {
      pool.query(
        format("SELECT * FROM %I", this.table),
        (err: Error, res: QueryResult<P>) => {
          if (err) {
            reject(new Error(err.message));
            return;
          }
          if (res.rows.length === 0) {
            resolve([]);
            return;
          }
          resolve(res.rows);
          return;
        }
      );
    });
  }

  /**
   * @description Method for inserting data into table of current model instance
   * @param cols Array{V} Array of columns name for which we want to insert the data for
   * @param values Array{T} Array of corresponding values for cols,both array must match in length
   * @returns The newly inserted row of the current model instance
   */
  insert<V = string[], T = string | number[], P = any>(
    cols: V[],
    values: T[]
  ): Promise<P> {
    const query = format(
      "INSERT INTO %I (%s) VALUES (%L) RETURNING *",
      this.table,
      cols,
      values
    );
    return new Promise<P>((resolve, reject) => {
      pool.query(query, (err: Error, res: QueryResult<P>) => {
        if (err) {
          reject(err.message);
          return;
        }
        resolve(res.rows[0]);
      });
    });
  }

  /**
   * @description   Method For Updating a Record
   * @param cols object of columns which we want to update the values of
   * @param values array of values for the corresponding cols object
   * @param whereColumn optional parameter if not provided all the records will be updated
   * @param whereValue optional parameter that must be provided if the user has already provided whereColumn
   * @param whereOperator optional parameter that must be provided if the user has already provided whereColumn and whereValue
   * @param returning Optional returning parameter if no returning parameter is passed it will return *
   * @returns returns specific data when updating if returning parameter is set to other than default otherwise will return updated row
   */
  update<V extends object = any, T = any, P = any>(
    cols: V,
    values: T[],
    whereColumn: string = "",
    whereValue: string | number = "",
    whereOperator: PostgresWhereInterface = "=",
    returning = "*"
  ): Promise<P> {
    //  check if length of cols and values if equal or note
    let colsAndValuesLengthIsEqual = true;
    if (Object.keys(cols).length != values.length) {
      colsAndValuesLengthIsEqual = false;
    }
    // variable for storing sets of cols=values
    let sets = [];
    //get cols and values and prepare cols=values sets
    for (let key in cols) {
      sets.push(format("%s=%L", key, cols[key]));
    }

    //convert sets array into a comma seperated string
    let setStrings = sets.join(",");

    if (!whereColumn) {
      return new Promise<P>((resolve, reject) => {
        // if cols and values length is not equal reject the promise
        if (!colsAndValuesLengthIsEqual) {
          reject("Length of cols and values is not same");
          return;
        }
        // otherwise run prepare the query
        const query = format(
          "UPDATE %I SET %s RETURNING %s",
          this.table,
          setStrings,
          returning
        );
        pool.query(query, (err: Error, res: QueryResult<P>) => {
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve(res.rows[0]);
          return;
        });
      });
    }
    return new Promise<P>((resolve, reject) => {
      // if cols and values length is not equal reject the promise
      if (!colsAndValuesLengthIsEqual) {
        reject("Length of cols and values is not same");
        return;
      }
      const query = format(
        "UPDATE %I SET %s WHERE %s %s %L::int RETURNING %s",
        this.table,
        setStrings,
        whereColumn,
        whereOperator,
        whereValue,
        returning
      );

      pool.query(query, (err: Error, result: QueryResult<P>) => {
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(result.rows[0]);
        return;
      });
    });
  }

  /**
   * @description Method for getting a record by id
   * @param id id of the record for which we want to get the data of
   * @returns row of the data if found by the provided id
   */
  find<P = any>(id: number): Promise<P> {
    if (!this.primary_key) {
      this.primary_key = this.table.concat("_id");
    }

    return new Promise<P>((resolve, reject) => {
      pool.query(
        format(
          "SELECT * FROM %I WHERE %s=%L::int",
          this.table,
          this.primary_key,
          id
        ),
        (err, res) => {
          if (err) {
            reject(new Error(err.message));
            return;
          }
          if (res.rows.length === 0) {
            reject(
              new Error(
                `No row found with the ID ${id} in the table ${this.table}`
              )
            );
            return;
          }
          resolve(res.rows[0]);
          return;
        }
      );
    });
  }

  /**
   * @description method for selecting specific columns
   * @param params Array of columns that we want to select, if no column is specified when calling the method * will be used to select all the columns
   * @returns this
   */
  select(params: string[] = ["*"]): this {
    params.forEach((param) => {
      this.bindings.selects.push(param);
    });
    return this;
  }

  /**
   * @description method for filtering results with where
   * @param firstIdentifier name of the column which we want to apply the where for
   * @param operator operator for comparing firstIdentifier and secondIdentifier
   * @param secondIdentifier value to which we want to compare the firstIdentifier and filter by
   * @returns this
   */
  where(
    firstIdentifier: string,
    operator: PostgresWhereInterface,
    secondIdentifier: string | number
  ): this {
    switch (this.isFirstWhere) {
      case false:
        if (typeof secondIdentifier === "number") {
          this.bindings.wheres.push(
            format(
              " AND %I %s %L::int",
              firstIdentifier,
              operator,
              secondIdentifier
            )
          );
          return this;
        }
        this.bindings.wheres.push(
          format(" AND %I %s %L", firstIdentifier, operator, secondIdentifier)
        );
        return this;

      default:
      case true:
        this.isFirstWhere = false;
        // if (!this.sqlQuery) {
        if (typeof secondIdentifier === "number") {
          this.bindings.wheres.push(
            format(
              "WHERE %s %s %L::int",

              firstIdentifier,
              operator,
              secondIdentifier
            )
          );
          return this;
        }
        this.bindings.wheres.push(
          format(
            "WHERE %s %s %L",

            firstIdentifier,
            operator,
            secondIdentifier
          )
        );

        return this;
    }
  }

  /**
   * @description by default where will add on multiple where chains but if you want to use OR instead of AND you can use this method instead
   * @param firstIdentifier name of the column which we want to apply the where for
   * @param operator operator for comparing firstIdentifier and secondIdentifier
   * @param secondIdentifier value to which we want to compare the firstIdentifier and filter by
   * @returns this
   */
  orWhere(
    firstIdentifier: string,
    operator: PostgresWhereInterface,
    secondIdentifier: string | number
  ): this {
    if (this.bindings.wheres.length === 0) {
      throw new Error(
        "Cannot use orWhere method with out having a chain with a where clause"
      );
    }
    if (typeof secondIdentifier === "number") {
      this.bindings.wheres.push(
        format(" OR %s %s %L::int", firstIdentifier, operator, secondIdentifier)
      );
      return this;
    }

    this.bindings.wheres.push(
      format(" OR %s %s %L", firstIdentifier, operator, secondIdentifier)
    );
    return this;
  }

  /**
   * @description method for handling joins
   * @param toBeJoinedTable name of the table to which we want to perform the join on
   * @param firstValue name of the column on left side of the operator
   * @param operator operator on which basis we want to perform the join on
   * @param secondValue name of the column or the value on the right side of the operator
   * @param type type of the join we want to perform by default it is INNER JOIN
   * @returns this
   */
  join(
    toBeJoinedTable: string,
    firstValue: string,
    operator: PostgresWhereInterface = "=",
    secondValue: string | number,
    type: string = "INNER"
  ): this {
    if (typeof secondValue === "number") {
      this.bindings.joins.push(
        format(
          "%s JOIN %I ON %s %s %s::int",
          type,
          toBeJoinedTable,
          firstValue,
          operator,
          secondValue
        )
      );
      return this;
    } else {
      this.bindings.joins.push(
        format(
          "%s JOIN %I ON %s %s %s",
          type,
          toBeJoinedTable,
          firstValue,
          operator,
          secondValue
        )
      );
      return this;
    }
  }

  /**
   * @description method for getting the result of the the constructed sql query by other helper methods e.g. select,where,join etc
   * @param limit limit the number of records we get by default no limit is applied
   * @returns all the resulting rows we get from executing our query
   */
  get<P = any>(limit?: string): Promise<P[]> {
    this.makeQuery();
    if (!this.sqlQuery) {
      throw new Error("You cannot call the get method directly");
    }

    return new Promise<P[]>((resolve, reject) => {
      if (limit) {
        this.sqlQuery = this.sqlQuery.concat(format(" LIMIT %L::int"), limit);
        pool.query(this.sqlQuery, (err, res) => {
          if (err) {
            reject(new Error(err.message));
            this.clearBindings();
            return;
          }
          this.clearBindings();
          resolve(res.rows);
          return;
        });
      }
      pool.query(this.sqlQuery, (err, res) => {
        if (err) {
          reject(new Error(err.message));
          this.clearBindings();
          return;
        }
        this.clearBindings();
        resolve(res.rows);
        return;
      });
    });
  }

  /**
   * @description method for constructing sql query from our bindings object
   * @returns string constructed sql query if no errors other wise will return void
   */
  private makeQuery(): string | void {
    if (
      this.bindings.selects.length !== 0 ||
      this.bindings.wheres.length !== 0 ||
      this.bindings.joins.length !== 0
    ) {
      this.sqlQuery = format(
        `SELECT %s FROM %I ${
          this.bindings.joins.length !== 0 ? this.bindings.joins.join(" ") : ""
        } ${
          this.bindings.wheres.length !== 0
            ? this.bindings.wheres.join(" ")
            : " "
        }`,
        this.bindings.selects.length !== 0 ? this.bindings.selects : "*",
        this.table
      );

      return this.sqlQuery;
    }
    return;
  }

  /**
   * @description this method will clear all the current bindings and set the current sqlQuery to empty
   * @returns void
   */
  private clearBindings(): void {
    this.sqlQuery = "";
    this.isFirstWhere = true;
    this.bindings = {
      selects: [],
      wheres: [],
      joins: [],
    };
    return;
  }
}
