import React, { useEffect, useState } from 'react';
import UserKeyItem from './UserKeyItem';
import UserKeyAdd from './UserKeyAdd';
import UserRegister from './UserRegister';

type IUser = {
  username: string,
  keys: [any],
}

type IUserViewState = {
  loading: boolean,
  user: IUser|null,
};

export default function UserView() {
  const [appState, setAppState] = useState<IUserViewState>({
    loading: true,
    user: null,
  });

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/v0/user');
      const user = await res.json();

      setAppState({
        loading: false,
        user,
      });
    };
    load();
  }, [setAppState]);

  if (appState.loading) {
    return (
      <section className="section">
        <div className="container">
          Loading
        </div>
      </section>
    );
  }

  if (!appState.user) {
    return (
      <section className="section">
        <div className="container">
          <UserRegister />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h2>{appState.user.username}</h2>
        {appState.user.keys.map((key) => {
          return (
            <UserKeyItem key={key} />
          );
        })}
        <UserKeyAdd user={appState.user} />
      </div>
    </section>
  );
}
