import { STARTING_CASH_CENTS } from "../models/contracts";

const LS_KEY = "investing_app_mock_v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {
      invites: {},       // inviteId -> { inviteId, classId, active, uses }
      memberships: {},   // `${classId}:${uid}` -> membership
      wallets: {},       // `${classId}:${uid}` -> wallet
    };
  } catch {
    return { invites: {}, memberships: {}, wallets: {} };
  }
}

function save(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(2, 6)}`;
}

function getOrCreateLocalUid() {
  const key = "iLa_local_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = makeId("uid");
    localStorage.setItem(key, uid);
  }
  return uid;
}

export const mockClient = {
  async createInvite({ classId }) {
    if (!classId) throw new Error("classId required");

    const state = load();
    const inviteId = makeId("invite");

    state.invites[inviteId] = {
      inviteId,
      classId,
      active: true,
      uses: 0,
    };

    save(state);
    return { inviteId, classId };
  },

  async joinClass({ inviteId }) {
    if (!inviteId) throw new Error("inviteId required");

    const state = load();
    const uid = getOrCreateLocalUid();

    const invite = state.invites[inviteId];
    if (!invite) throw new Error("Invalid invite");
    if (!invite.active) throw new Error("Invite inactive");

    const classId = invite.classId;
    const key = `${classId}:${uid}`;

    // membership (idempotent)
    if (!state.memberships[key]) {
      state.memberships[key] = {
        classId,
        uid,
        role: "student",
        joinedAt: new Date().toISOString(),
      };
    }

    // wallet (idempotent) — only created once
    if (!state.wallets[key]) {
      state.wallets[key] = {
        classId,
        uid,
        cashCents: STARTING_CASH_CENTS,
      };
      invite.uses += 1;
      state.invites[inviteId] = invite;
    }

    save(state);

    return {
      classId,
      uid,
      cashCents: state.wallets[key].cashCents,
    };
  },

  async getWallet({ classId }) {
    const state = load();
    const uid = getOrCreateLocalUid();
    const key = `${classId}:${uid}`;
    const wallet = state.wallets[key];
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  },
  async ensureWallet({ classId }) {
  const state = load();
  const uid = getOrCreateLocalUid();
  const key = `${classId}:${uid}`;

  if (!state.wallets[key]) {
    state.wallets[key] = {
      classId,
      uid,
      cashCents: STARTING_CASH_CENTS,
    };
    save(state);
  }

  return state.wallets[key];
},
};
