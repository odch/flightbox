import React, {Component} from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Centered from '../Centered'
import MaterialIcon from '../MaterialIcon'
import JumpNavigation from '../JumpNavigation'
import VerticalHeaderLayout from '../VerticalHeaderLayout'
import ProfileForm from './ProfileForm'

const Content = styled.div`
  padding: 2em;
`;

class ProfilePage extends Component {

  componentDidMount() {
    this.props.loadProfile()
  }

  render() {
    const {profile, saving, saveProfile} = this.props;

    if (!profile) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> Bitte warten ...</Centered>;
    }

    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <ProfileForm saveProfile={saveProfile} saving={saving}/>
        </Content>
      </VerticalHeaderLayout>
    )
  }
}

ProfilePage.propTypes = {
  profile: PropTypes.shape({
    defaultValues: PropTypes.shape({
      email: PropTypes.string
    })
  }),
  loadProfile: PropTypes.func.isRequired,
  saveProfile: PropTypes.func.isRequired
};

export default ProfilePage;
