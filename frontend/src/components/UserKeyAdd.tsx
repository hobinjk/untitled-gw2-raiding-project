import React from 'react';

export default function UserKeyAdd(props: any) {
  return (
    <form action="/api/v0/user/keys" method="post">
      <div className="field">
        <label className="label" htmlFor="key">Account Key</label>
        <div className="control">
          <input className="input" type="text" name="key" id="key" required />
        </div>
      </div>
      <div className="field">
        <input className="button" type="submit" value="Add" />
      </div>
    </form>
  );
}
