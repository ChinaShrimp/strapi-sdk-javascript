import anyTest, { TestInterface } from 'ava';
import * as sinon from 'sinon';
import Strapi from './sdk';

const test = anyTest as TestInterface<{
  strapi: Strapi;
  axiosRequest: sinon.SinonStub;
}>;

test.beforeEach(t => {
  const strapi = new Strapi('http://strapi-host');
  t.context = {
    axiosRequest: sinon.stub(strapi.axios, 'request').resolves({
      data: {}
    }),
    strapi
  };
});

test('Create an instance', t => {
  t.deepEqual(
    Object.getOwnPropertyNames(Object.getPrototypeOf(t.context.strapi)),
    [
      'constructor',
      'request',
      'register',
      'login',
      'forgotPassword',
      'resetPassword',
      'getEntries',
      'getEntry',
      'createEntry',
      'updateEntry',
      'deleteEntry',
      'searchFiles',
      'getFiles',
      'getFile',
      'upload',
      'setToken',
      'clearToken'
    ]
  );

  t.deepEqual(Object.getOwnPropertyNames(t.context.strapi), ['axios']);

  t.deepEqual(t.context.strapi.axios.defaults.baseURL, 'http://strapi-host');
});

test('Make a request', async t => {
  t.context.axiosRequest.resolves({
    data: [{ foo: 'bar' }]
  });
  const data = await t.context.strapi.request('get', '/foo');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      url: '/foo'
    })
  );
  t.deepEqual(data, [{ foo: 'bar' }]);
});

test('Make a request with custom axios config', t => {
  t.context.strapi.request('get', '/foo', {
    headers: {
      foo: 'bar'
    }
  });

  t.true(
    t.context.axiosRequest.calledWithExactly({
      headers: {
        foo: 'bar'
      },
      method: 'get',
      url: '/foo'
    })
  );
});

test('Catch a request', async t => {
  t.context.axiosRequest.rejects({
    response: {
      data: {
        message: 'error'
      }
    }
  });

  await t.throws(
    async () => {
      await t.context.strapi.request('get', '/foo');
    },
    { message: 'error' }
  );
});

test('Register', async t => {
  t.context.axiosRequest.resolves({
    data: {
      jwt: 'foo',
      user: {}
    }
  });
  const authentication = await t.context.strapi.register(
    'username',
    'foo@bar.com',
    'password'
  );

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        email: 'foo@bar.com',
        password: 'password',
        username: 'username'
      },
      method: 'post',
      url: '/auth/local/register'
    })
  );
  t.deepEqual(authentication, {
    jwt: 'foo',
    user: {}
  });
});

test('Login', async t => {
  t.context.axiosRequest.resolves({
    data: {
      jwt: 'foo',
      user: {}
    }
  });
  const authentication = await t.context.strapi.login('identifier', 'password');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        identifier: 'identifier',
        password: 'password'
      },
      method: 'post',
      url: '/auth/local'
    })
  );
  t.deepEqual(authentication, {
    jwt: 'foo',
    user: {}
  });
});

test.serial('Set Authorization header on axios', async t => {
  t.is(t.context.strapi.axios.defaults.headers.common.Authorization, undefined);
  const setToken = sinon.spy(t.context.strapi, 'setToken');
  t.context.axiosRequest.resolves({
    data: {
      jwt: 'foo',
      user: {}
    }
  });
  const authentication = await t.context.strapi.login('identifier', 'password');

  t.true(setToken.calledWithExactly(authentication.jwt));
  t.is(
    t.context.strapi.axios.defaults.headers.common.Authorization,
    'Bearer foo'
  );
});

test('Forgot password', async t => {
  await t.context.strapi.forgotPassword(
    'foo@bar.com',
    'https://my-domain.com/reset-password'
  );

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        email: 'foo@bar.com',
        url: 'https://my-domain.com/reset-password'
      },
      method: 'post',
      url: '/auth/forgot-password'
    })
  );
});

test('Reset password', async t => {
  await t.context.strapi.resetPassword('code', 'password', 'confirm');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        code: 'code',
        password: 'password',
        passwordConfirmation: 'confirm'
      },
      method: 'post',
      url: '/auth/reset-password'
    })
  );
});

test('Get entries', async t => {
  await t.context.strapi.getEntries('user', {
    _sort: 'email:asc'
  });

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      params: {
        _sort: 'email:asc'
      },
      url: '/user'
    })
  );
});

test('Get entry', async t => {
  await t.context.strapi.getEntry('user', 'ID');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      url: '/user/ID'
    })
  );
});

test('Create entry', async t => {
  await t.context.strapi.createEntry('user', {
    foo: 'bar'
  });

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        foo: 'bar'
      },
      method: 'post',
      url: '/user'
    })
  );
});

test('Update entry', async t => {
  await t.context.strapi.updateEntry('user', 'ID', {
    foo: 'bar'
  });

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: {
        foo: 'bar'
      },
      method: 'put',
      url: '/user/ID'
    })
  );
});

test('Delete entry', async t => {
  await t.context.strapi.deleteEntry('user', 'ID');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'delete',
      url: '/user/ID'
    })
  );
});

test('Search files', async t => {
  await t.context.strapi.searchFiles('foo');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      url: '/upload/search/foo'
    })
  );
});

test('Get files', async t => {
  await t.context.strapi.getFiles({
    _sort: 'size:asc'
  });

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      params: {
        _sort: 'size:asc'
      },
      url: '/upload/files'
    })
  );
});

test('Get file', async t => {
  await t.context.strapi.getFile('ID');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      method: 'get',
      url: '/upload/files/ID'
    })
  );
});

test('Upload file', async t => {
  await t.context.strapi.upload('foo');

  t.true(
    t.context.axiosRequest.calledWithExactly({
      data: 'foo',
      method: 'post',
      url: '/upload'
    })
  );
});

test('Set token', t => {
  t.is(t.context.strapi.axios.defaults.headers.common.Authorization, undefined);
  t.context.strapi.setToken('foo');
  t.is(
    t.context.strapi.axios.defaults.headers.common.Authorization,
    'Bearer foo'
  );
});
