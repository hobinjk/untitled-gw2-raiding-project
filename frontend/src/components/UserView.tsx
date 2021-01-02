import React, { useEffect, useState } from 'react';
import UserKeyItem from './UserKeyItem';
import UserKeyAdd from './UserKeyAdd';
import UserRegister from './UserRegister';
import UserLogin from './UserLogin';
import API from '../API';

type IUser = {
  name: string,
  email: string,
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
      const res = await API.fetch('/api/v0/user');
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
          <UserLogin />
        </div>
        <div className="container">
          <UserRegister />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <p>Name: {appState.user.name}</p>
        <p>Email: {appState.user.email}</p>
        {appState.user.keys.map((key) => {
          return (
            <UserKeyItem key={key} />
          );
        })}
        {false &&
          <UserKeyAdd user={appState.user} />
        }
      </div>
    </section>
  );
}
