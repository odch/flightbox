import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {createApiKey, loadApiKeys, revokeApiKey} from '../modules/apiKeys';
import ApiAccess, {ApiAccessProps} from '../components/ApiAccess';
import {RootState} from '../modules';

const ApiAccessContainer = (props: ApiAccessProps) => {
  useEffect(() => {
    props.loadApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ApiAccess {...props}/>;
};

const mapStateToProps = (state: RootState) => ({
  keys: state.apiKeys.keys,
  availableScopes: state.apiKeys.availableScopes,
  loadError: state.apiKeys.loadError,
  creating: state.apiKeys.creating,
  createError: state.apiKeys.createError,
  revoking: state.apiKeys.revoking,
  revokeError: state.apiKeys.revokeError,
});

const mapActionCreators = {
  loadApiKeys,
  createApiKey,
  revokeApiKey,
};

export default connect(mapStateToProps, mapActionCreators)(ApiAccessContainer as any);
