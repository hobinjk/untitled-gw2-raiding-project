import React from 'react';
import API from '../API';

export default function UserKeyItem(props: any) {
  const {
    apiKey
  } = props;

  async function onDelete() {
    const res = await API.fetch(`/api/v0/user/keys/${apiKey.key}`, {
      method: 'DELETE'
    });
    let err = await res.json();
    if (err.error) {
      console.warn(err.error);
    }
    window.location.reload();
  }

  return (
    <tr>
      <td>
        {apiKey.account}
      </td>
      <td>
        <input className="button" type="button" value="Delete" onClick={onDelete}/>
      </td>
    </tr>
  );
}
