import gql from "graphql-tag";

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )
  type User @key(fields: "id followingIds") @shareable {
    id: ID!
    username: String!
    fname: String!
    lname: String!
    imageUrl: String
    following: [User!]!
    followers: [User!]!
    isFollowing: Boolean!
    followingIds: [ID!]!
  }
  type JwtToken {
    token: String!
  }
  # type Follows {
  #   follower: User
  #   following: User
  # }
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
  type Product @key(fields: "id userId") {
    id: ID!
    userId: String!
    owner: User
  }
  # type Message @key(fields: "id senderId receiverId") {
  #   id: ID!
  #   senderId: ID!
  #   receiverId: ID!
  #   sender: User
  #   receiver: User
  # }
  type Comments @key(fields: "id userId") {
    id: ID!
    userId: String!
    author: User
  }
  type FollowResult {
    success: Boolean!
    user: User
  }
  type Query {
    users: [User]
    searchUsers(username: String!): [User!]!
    user(username: String!): User
    publicUserProfile(username: String!): User
    userProfile: User
    helloworld: String
  }
  type Mutation {
    createUser(
      username: String!
      password: String!
      fname: String!
      lname: String!
      imageUrl: String
    ): User!
    updateUser(fname: String, lname: String, imageUrl: String): User!
    login(username: String!, password: String!): JwtToken!
    follow(username: ID!): FollowResult!
    unfollow(username: ID!): FollowResult!
  }
`;
export default typeDefs;
