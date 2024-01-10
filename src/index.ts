import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import couchbase, {
  Bucket,
  Collection,
  GetResult,
  MutationResult,
} from "couchbase";
import { v4 as uuidv4 } from "uuid";

const typeDefs = `#graphql
    type Product {
        name: String
        price: Float
        quantity: Int
        tags: [String]
    }

    input ProductInput {
        name: String
        price: Float
        quantity: Int
        tags: [String]
    }

    type Query {
        getProduct(id: String): Product
    }

    type Mutation {
        createProduct(product: ProductInput): Product
        deleteProduct(id: String): Boolean
        updateProduct(id: String, product: ProductInput): Product
    }
`;

const resolvers = {
  Query: {
    async getProduct(_, args, contextValue) {
      const { id } = args;

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket("store-bucket");

      const collection: Collection = bucket
        .scope("products-scope")
        .collection("products");

      const getResult: GetResult = await collection.get(id).catch((error) => {
        console.log(error);
        throw error; // Document not found
      });

      return getResult.content;
    },
  },
  Mutation: {
    async createProduct(_, args, contextValue) {
      const { product } = args; // product: {name: "Michael"}

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket("store-bucket");

      const collection: Collection = bucket
        .scope("products-scope")
        .collection("products");

      const key = uuidv4();

      const createdMutationResult: MutationResult = await collection
        .insert(key, product)
        .catch((error) => {
          console.log(error);
          throw error; // Document not found
        });

      return product;
    },
    async deleteProduct(_, args, contextValue) {
      const { id } = args;

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket("store-bucket");

      const collection: Collection = bucket
        .scope("products-scope")
        .collection("products");

      const deleteMutationResult: MutationResult = await collection
        .remove(id)
        .catch((error) => {
          console.log(error);
          throw error; // Document not found
        });

      return true;
    },
    async updateProduct(_, args, contextValue) {
      const { id, product } = args;

      const bucket: Bucket =
        contextValue.couchbaseCluster.bucket("store-bucket");

      const collection: Collection = bucket
        .scope("products-scope")
        .collection("products");

      const updateMutationResult: MutationResult = await collection
        .replace(id, product)
        .catch((error) => {
          console.log(error);
          throw error; // Document not found
        });

      return product;
    },
  },
};

const server = new ApolloServer({
  typeDefs, // Defining our GraphQL types (Product, Query, Mutation)
  resolvers, // To create logic for certain GraphQL types (Query, Mutation)
});

// User inputs
const clusterConnStr = "couchbases://cb.zgnlruo1jwglan78.cloud.couchbase.com"; // Replace this with Connection String

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => ({
    couchbaseCluster: await couchbase.connect(clusterConnStr, {
      username: "<enter username>",
      password: "<enter password>",
      // Use the pre-configured profile below to avoid latency issues with your connection.
      configProfile: "wanDevelopment",
    }),
  }),

  // inside of our API routes we can access context.couchbaseCluster
});

console.log("Server running on " + url);
