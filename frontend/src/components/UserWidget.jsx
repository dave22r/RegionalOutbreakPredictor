import { useContext, useEffect, useState } from "react";

import Icon from "@mdi/react";
import { mdiCogOutline, mdiLogout, mdiWindowClose } from "@mdi/js";

import { GlobalContext } from "../contexts/GlobalContext";
import { Portal } from "./Portal";

const { VITE_BACKEND_URL } = import.meta.env;

export const UserWidget = () => {
  const { userData, setUserData } = useContext(GlobalContext);
  useEffect(() => {
    (async () => {
      try {
        const j = await fetch(`${VITE_BACKEND_URL}/auth/info`, {
          credentials: "include",
        }).then((j) => j.json());
        if (j.name) setUserData(j);
      } catch {}
    })();
  }, []);

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      {userData.name ? (
        <>
          <button
            type="button"
            className="top-4 right-4 fixed rounded-full cursor-pointer"
            onClick={() => setShowUserMenu(true)}
          >
            <img
              className="rounded-full w-10 h-10"
              src={userData.picture}
              referrerPolicy="no-referrer"
            />
          </button>
          {showUserMenu && (
            <Portal>
              <div
                className="top-0 right-0 bottom-0 left-0 z-40 fixed bg-opacity-50"
                onClick={() => setShowUserMenu(false)}
              >
                <div
                  className="top-0 xs:top-16 right-0 xs:right-4 bottom-0 xs:bottom-auto left-0 xs:left-auto fixed flex flex-col items-center gap-8 bg-gray-800 shadow-xl p-4 xs:rounded-3xl w-full xs:max-w-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-sm">{userData.email}</p>
                  <img
                    className="rounded-full w-16 h-16"
                    src={userData.picture}
                    referrerPolicy="no-referrer"
                  />
                  <p className="-mt-4 text-lg">Hello, {userData.given_name}</p>
                  <div className="flex flex-col items-stretch gap-1 w-full">
                    <UserMenuActionButton
                      onClick={() => {
                        // TODO: settings
                      }}
                    >
                      <Icon path={mdiCogOutline} size={1} />
                      Settings
                    </UserMenuActionButton>
                    <UserMenuActionButton
                      onClick={() => {
                        setUserData({});
                        // TODO: remove session on backend
                      }}
                    >
                      <Icon path={mdiLogout} size={1} />
                      Sign out
                    </UserMenuActionButton>
                  </div>

                  <button
                    type="button"
                    className="top-2 right-2 absolute hover:bg-gray-700 p-2 rounded-full text-gray-200 cursor-pointer"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Icon path={mdiWindowClose} size={1} />
                  </button>
                </div>
              </div>
            </Portal>
          )}
        </>
      ) : (
        <button
          type="button"
          className="top-4 right-4 fixed cursor-pointer"
          onClick={() => {
            location.href = `${VITE_BACKEND_URL}/auth/login`;
          }}
        >
          Sign in
        </button>
      )}
    </>
  );
};

const UserMenuActionButton = ({ children, onClick }) => {
  return (
    <button
      type="button"
      className="flex justify-start items-center gap-3 bg-gray-900 hover:bg-gray-700 px-5 py-4 rounded first:rounded-t-3xl last:rounded-b-3xl w-full text-sm cursor-pointer"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
