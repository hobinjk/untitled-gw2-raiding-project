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
      let user;
      try {
        const res = await API.fetch('/api/v0/user');
        user = await res.json();
      } catch (e) {
        console.warn(e);
      }

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
        <table className="table">
          <thead>
            <tr>
              <th>Verified Account</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appState.user.keys.map((key) => {
              console.log('key', key);
              return (
                <UserKeyItem apiKey={key} />
              );
            })}
          </tbody>
        </table>
        <UserKeyAdd user={appState.user} />
      </div>
    </section>
  );
}
