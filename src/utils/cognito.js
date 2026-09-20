const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

// Create user in Cognito
async function createCognitoUser(email, password) {
  const { AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
  
  try {
    // Create user with temporary password
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });
    
    await client.send(createCommand);
    
    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true
    });
    
    await client.send(setPasswordCommand);
    
    return email;
  } catch (err) {
    throw new Error(`Cognito signup failed: ${err.message}`);
  }
}

// Login and get token
async function loginUser(email, password) {
  const command = new AdminInitiateAuthCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  try {
    const response = await client.send(command);
    return response.AuthenticationResult.IdToken;
  } catch (err) {
    throw new Error(`Cognito login failed: ${err.message}`);
  }
}

module.exports = { createCognitoUser, loginUser };