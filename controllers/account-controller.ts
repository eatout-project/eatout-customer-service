import {Request, Response} from "express";
import {Knex} from "knex";
import bcrypt from 'bcryptjs';

export const createAccount = (req: Request, res: Response, db: Knex) => {
    console.log(req.body)
    const {email, password, firstName, lastName, phone} = req.body;

    if (!email || !password) {
        console.log('empty fields')
        return res.status(400).json('empty fields');
    }
    if (password.length > 49) {
        return res.status(400).json('password is too long. Maximum is 49 characters');
    }

    db.transaction(trx => {
        trx.select('*').from('customers_login').where('email', email)
            .then(existingCustomer => {
                if (existingCustomer[0]) {
                    return res.status(400).json('Unable to register. Email already in use. ')
                }

                bcrypt.hash(password, 10)
                    .then(hashedPasword => {
                        trx.insert({email, hash: hashedPasword}).into('customers_login')
                            .then(affectedRows => {
                                trx.insert({email, firstName, lastName, phone}).into('customers')
                                    .then(affectedRows => {
                                        trx.select('*').from('customers').where('email', email)
                                            .then(customer => {
                                                trx.commit();
                                                return res.status(200).json(customer[0]);
                                            })
                                    })
                            })
                            .catch(error => {
                                console.log(error);
                                trx.rollback();
                                return res.status(501).json('Unable to register. Internal server error');
                            })
                    })
                    .catch(error => {
                        trx.rollback();
                        console.log(error);
                        return res.status(400).json('error');
                    })
            })
            .catch(error => {
                trx.rollback();
                console.log(error);
                return res.status(400).json('error');
            })
    })
        .catch(error => {
            console.log(error);
            return res.status(501).json('Unable to register. Internal server error');
        })
}

export const login = (req: Request, res: Response, db: Knex) => {
    console.log(req.body)
    const {email, password} = req.body;
    db.transaction(trx => {
        trx.select('*').from('customers_login').where('email', email)
            .then(existingCustomer => {
                console.log('hash: ', existingCustomer[0].hash);
                console.log('password: ', password);
                if (!existingCustomer[0].email) {
                    return res.status(400).json('Unable to login. No user with the entered email exist.');
                }

                if (bcrypt.compareSync(password, existingCustomer[0].hash)) {
                    db.select('*').from('customers').where('email', email)
                        .then(customer => {
                            if (!customer[0].email) {
                                trx.rollback();
                                return res.status(501).json('Unable to login. Internal server error');
                            }
                            trx.commit();
                            return res.status(200).json(customer[0]);
                        })
                }
            })
            .catch(error => {
                console.log(error);
                trx.rollback();
                return res.status(400).json('unable to login')
            })
    })
}

export const verifyAccount = (req: Request, res: Response, db: Knex) => {
    console.log('verify account: ', req.body)
    const {id} = req.body;
    console.log('verify id: ', id);
    db.transaction(trx => {
        trx.select('*').from('customers').where('id', id)
            .then(customer => {
                console.log(customer);
                if (customer.length) {
                    trx.commit();
                    return res.status(200).json(true);
                }
                console.log('not found')
                trx.rollback();
                return res.status(400).json(false);
            })
            .catch(error => {
                trx.rollback();
                console.log(error);
                return res.status(400).json('error');
            })
    })
}
