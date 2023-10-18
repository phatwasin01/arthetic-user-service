import gql from "graphql-tag";

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )
  type User @key(fields: "id followsIds") @shareable {
    id: ID!
    username: String!
    password: String!
    fname: String!
    lname: String!
    image_url: String
    follows: [Follows]
    followers: [Follows]
    followsIds: [ID]
  }
  type JwtToken {
    token: String!
  }
  type Follows {
    follower: User
    following: User
  }
  type Likes @key(fields: "userId") {
    userId: ID!
    user: User
  }
  type Posts @key(fields: "id userId repostUserId") {
    id: ID!
    userId: String!
    repostUserId: String
    author: User
    repostUser: User
  }
  type Comments @key(fields: "id userId") {
    id: ID!
    userId: String!
    author: User
  }
  type Query {
    users: [User]
    user(id: ID!): User
    userFollows(id: ID!): [Follows]
    publicUserProfile(username: String!): User
    userProfile: User
  }
  type Mutation {
    createUser(
      username: String!
      password: String!
      fname: String!
      lname: String!
      image_url: String
    ): User
    login(username: String!, password: String!): JwtToken
    followUser(followingId: ID!): Follows
    unfollowUser(followingId: ID!): Follows
  }
`;
export default typeDefs;
