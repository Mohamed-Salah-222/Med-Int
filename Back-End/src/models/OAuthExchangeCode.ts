import mongoose, { Schema, Document, Types } from "mongoose";

//*=====================================================
//* ONE-TIME OAUTH EXCHANGE CODE
//*=====================================================
//* Backs the redirect handoff after a successful Google login. The browser
//* receives only this opaque code; the JWT is handed over by a POST to
//* /api/auth/oauth/exchange, so it never lands in browser history, a Referer
//* header, or an access log.
//*
//* Stored in MongoDB rather than an in-process Map on purpose: the callback and
//* the exchange are two separate requests, and behind more than one instance
//* they can land on different processes. An in-memory store would fail
//* intermittently in exactly that setup, and would also drop valid codes on
//* every restart or deploy.
//*
//* Only the SHA-256 of the code is persisted, matching how verification codes
//* and reset tokens are handled elsewhere in this codebase — a database dump
//* inside the 60s window yields nothing replayable. The JWT itself is not
//* stored at all; it is minted at exchange time from the user id below.

export interface IOAuthExchangeCode extends Document {
  codeHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const oauthExchangeCodeSchema = new Schema<IOAuthExchangeCode>(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

//* Housekeeping only. Mongo's TTL monitor runs about once a minute, so an
//* expired document can briefly outlive its expiry — every read must still
//* filter on expiresAt rather than trusting this index for correctness.
oauthExchangeCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthExchangeCode = mongoose.model<IOAuthExchangeCode>("OAuthExchangeCode", oauthExchangeCodeSchema);

export default OAuthExchangeCode;
