/** The signed-in user as exposed to the app. Never includes tokens. */
export type AuthUser = {
  id: string;
  email: string;
};

export type SignUpData = {
  status: "confirmation_required";
  email: string;
};
