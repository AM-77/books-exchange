const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const axios = require('axios');
const mailer = require('../../utils/mailer');
const User = require('../../models/user.model');
const { makeRandStr } = require('../../utils/helpers');

const registerWithGoogle = (req, res) => {
  const { tokenId } = req.body;
  axios
    .get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenId}`)
    .then((response) => {
      const { email } = response.data;
      User.findOne({ email })
        .exec()
        .then((user) => {
          if (user) {
            res.status(401).json({
              message: {
                type: 'error',
                content:
                  "This Google account's email address is already in use.",
              },
            });
          } else {
            const { name } = response.data;
            const password = makeRandStr(12);

            bcryptjs.hash(String(password), 7, async (error, hashed) => {
              if (error) {
                res.status(500).json({
                  message: {
                    type: 'error',
                    content:
                      'Apologies, this is not supposed to happen, Please report this to us.',
                  },
                  error,
                });
              } else {
                const newUser = new User({
                  _id: new mongoose.Types.ObjectId(),
                  name: name.toLowerCase(),
                  email,
                  password: hashed,
                  username: name.split(' ')[0],
                  wilaya: 'adrar',
                  verified: true,
                  picture: 'api/uploads/users/0321661312364.png',
                  complete: false,
                });

                newUser
                  .save()
                  .then((userResult) => {
                    res.status(201).json({
                      created: userResult,
                      success: true,
                      message: {
                        type: 'success',
                        content: `Welcome aboard @${name}, we have created an account for you, and emailed your password. You can now sign in with Google or with your email & password.`,
                      },
                    });
                    const emailContent = `
                      <div style="max-width: 600px; text-align: center; color: #000000; margin: 0 auto;">
                        <img style="display: inline-block; width: 128px; height: 128px;" src="https://i.ibb.co/NsPb7kB/Untitled-1.png" />
                        <p>Hello ${name},</p>
                        <p>Thank you for joining <b style="color: #ea4c89;">Read Me</b>.</p>
                        <p>After your singing up with Google, we have created an account for you, and set up this password <b>${password}</b> for you.</p>
                        <p>You can sing in with your Google or with your email & password.</p>
                        <br />
                        <p>Best Regards</p>
                        <p>The <b style="color: #ea4c89;">Read Me</b> team</p>
                      </div>
                    `;
                    mailer(email, 'Read Me - Account Creation', emailContent);
                  })
                  .catch((userError) =>
                    res.status(500).json({
                      message: {
                        type: 'error',
                        content:
                          'Apologies, this is not supposed to happen, Please report this to us.',
                      },
                      error: userError,
                    })
                  );
              }
            });
          }
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({
            message: {
              type: 'error',
              content:
                'Apologies, this is not supposed to happen, Please report this to us.',
            },
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: {
          type: 'error',
          content:
            'Apologies, we could not login with Google. Please refrech the page and try again. 4',
        },
      });
    });
};

module.exports = registerWithGoogle;
