'use strict';

const syncUsers = async (firebase, users) => {
  const usersRef = firebase.ref('users')

  const currentUsers = await fetchCurrentUsers(usersRef)
  const importedUsers = mapUsersByMemberNr(users)

  const {updates, deletes} = buildUpdatesAndDeletes(currentUsers, importedUsers)
  await applyUpdatesAndDeletes(usersRef, updates, deletes)
}

async function fetchCurrentUsers(usersRef) {
  const snapshot = await usersRef.once('value')
  const users = snapshot.val() || {}

  // Transform users to a map where memberNr is the key for easy lookup
  const userMap = {}
  Object.keys(users).forEach(id => {
    const user = users[id]
    if (user.memberNr) {
      userMap[user.memberNr] = {...user, id}
    }
  })
  return userMap
}

function mapUsersByMemberNr(users) {
  const userMap = {}
  users.forEach(user => {
    if (user.memberNr) {
      userMap[user.memberNr] = user
    }
  })
  return userMap
}

function buildUpdatesAndDeletes(currentUsers, importedUsers) {
  const updates = {}
  const deletes = []

  // Add new users and update existing ones
  Object.keys(importedUsers).forEach(memberNr => {
    const importedUser = importedUsers[memberNr]
    if (currentUsers[memberNr]) {
      // Existing user - update by ID
      updates[currentUsers[memberNr].id] = importedUser
    } else {
      // New user - add to the list of new users
      updates[`new-${memberNr}`] = importedUser // Placeholder for new
    }
  })

  // Delete users that are not present in the imported array
  Object.keys(currentUsers).forEach(memberNr => {
    if (!importedUsers.hasOwnProperty(memberNr)) {
      deletes.push(currentUsers[memberNr].id)
    }
  })

  return {updates, deletes}
}

async function applyUpdatesAndDeletes(usersRef, updates, deletes) {
  // Apply new and updated users
  const batch = {}
  for (const key in updates) {
    if (key.startsWith('new-')) {
      // Generate new ID for new user
      await usersRef.push(updates[key])
    } else {
      // Update existing user
      batch[key] = updates[key]
    }
  }

  // Remove users
  deletes.forEach(async id => {
    await usersRef.child(id).remove()
  })

  // Apply updates
  await usersRef.update(batch)
}

module.exports = syncUsers
