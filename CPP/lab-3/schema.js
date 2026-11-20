// GraphQL-схема мовою SDL. Типи Medicine і Order відповідають моделям Mongoose з ЛР №2.
export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Medicine {
    id: ID!
    name: String!
    category: String!
    manufacturer: String!
    price: Float!
    prescriptionRequired: Boolean!
    description: String!
    createdAt: String!
    "Користувач, який додав препарат через GraphQL; null для препаратів із REST/seed"
    owner: User
  }

  type OrderItem {
    name: String!
    price: Float!
    qty: Int!
  }

  type Order {
    id: ID!
    name: String!
    phone: String!
    address: String!
    items: [OrderItem!]!
    total: Float!
    createdAt: String!
  }

  input OrderItemInput {
    id: ID!
    qty: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    me: User
    medicines: [Medicine!]!
    medicine(id: ID!): Medicine
    orders: [Order!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createMedicine(
      name: String!
      category: String!
      manufacturer: String!
      price: Float!
      prescriptionRequired: Boolean = false
      description: String = ""
    ): Medicine!
    updateMedicine(
      id: ID!
      name: String!
      category: String!
      manufacturer: String!
      price: Float!
      prescriptionRequired: Boolean = false
      description: String = ""
    ): Medicine!
    deleteMedicine(id: ID!): Boolean!
    createOrder(name: String!, phone: String!, address: String!, items: [OrderItemInput!]!): Order!
  }
`;
