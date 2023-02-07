 /**
     * Generate a keypair based on the supplied seed string.
     * @param {string} keySeed - The seed that should be used to generate the keypair.
     * @returns {*} The generated keypair.
     */
    generateKeypair(keySeed) {
        if (typeof keySeed == "undefined" || keySeed == "") return new driver.Ed25519Keypair();
        return new driver.Ed25519Keypair(bip39.mnemonicToSeed(keySeed).slice(0, 32));
    }
	
 /**
     * Creation of various users and devices as assets on the blockchain and establishes a parent-child relationship
     */
createAPPdetails(){
		
			document.getElementById('update').value = "NameSpace set to : " + nameSpace
			
			// create admin user type - this is the asset representing the group of admins
			const adminGroupAsset = {
				ns: `${nameSpace}.admin`,
				name: 'admin'
			}
			const adminGroupMetadata = {
				can_link: [this.vaahanam.appadmin.publicKey]
			}
			
			
			const adminGroupId = (this.createNewAsset(this.vaahanam.appadmin, adminGroupAsset, adminGroupMetadata)).id
			console.log('AdminGroup: ' + adminGroupId)
			
			// create admin user instance - this is a single user with admin role represented by an asset
			const adminUserMetadata = {
				event: 'User Assigned',
				date: new Date(),
				timestamp: Date.now(),
				publicKey: this.vaahanam.appadmin.publicKey,
				eventData: {
					userType: 'admin'
				}
			}	
			
			// create app - the umbrella asset for representing the app
			const appAsset = {
				ns: nameSpace,
				name: nameSpace
			}

			const appMetadata = {
				can_link: adminGroupId
			}

			const appId = (this.createNewAsset(this.vaahanam.appadmin, appAsset, appMetadata)).id
			console.log('App: ' + appId)
			
			const adminUserId = (this.createUser(this.vaahanam.appadmin, adminGroupId, 'admin', this.vaahanam.appadminPublicKey, adminUserMetadata)).id
			console.log('AdminUser1: ' + adminUserId)
			
			//Create types
			const rtoId = (this.createType('rto', appId, adminGroupId)).id
			console.log('RTO : ' + rtoId)

			const vspId = (this.createType('vehicleserviceprovider', appId, adminGroupId)).id
			console.log('Vehicle Service Provider : ' + vspId)
			
			const iotId = (this.createType('iotdevice', appId, adminGroupId)).id
			console.log('IOT Device : ' + iotId)
			
			const userId = (this.createType('user', appId, rtoId)).id
			console.log('User (Vehicle Owners) : ' + userId)
				
			const vehicleId = (this.createType('vehicle', appId, rtoId)).id
			console.log('Vehicle : ' + vehicleId)
			
			const userMetadata = {
				event: 'User Assigned',
				date: new Date(),
				timestamp: Date.now(),
				publicKey: this.vaahanam.appadminPublicKey,
				eventData: {
					userType: 'RTO of Mettupalayam'
				}
			}

			const rtoassetId_mtp = (this.createUser(this.vaahanam.appadmin, rtoId, 'rto' , this.vaahanam.raPublicKey, userMetadata)).id
			console.log('RTO of Mettupalayam : ' + rtoassetId_mtp)

			const user2Metadata = {
				event: 'User Assigned',
				date: new Date(),
				timestamp: Date.now(),
				publicKey: this.vaahanam.appadminPublicKey,
				eventData: {
					userType: 'RTO of Chennai South'
				}
			}

			// user 2 added to tribe 2
			const rtoassetId_maa = (this.createUser(this.vaahanam.appadmin, rtoId, 'rto', this.vaahanam.ra1PublicKey, user2Metadata)).id
			console.log('RTO of Chennai South : ' + rtoassetId_maa)
			

		},
		
		createTypeInstance(keypair, asset, metadata) {
			

		return this.createNewAsset(keypair, asset, metadata)
		},
		createUser(adminKeyPair, userTypeId, userTypeName, userPublicKey, userMetadata) {
			const asset = {
				ns: `${nameSpace}.${userTypeName}`,
				link: userTypeId,
				createdBy: adminKeyPair.publicKey,
				type: userTypeName,
				keyword: 'UserAsset'
			}

			const metadata = {
				event: 'User Added',
				date: new Date(),
				timestamp: Date.now(),
				publicKey: userPublicKey,
				eventData: {
					userType: userTypeName
				}
			}

			const instanceTx = this.createNewAsset(adminKeyPair, asset, metadata)
			this.transferAsset(instanceTx, adminKeyPair, userPublicKey, userMetadata)
			return instanceTx
		},
		createType(typeName, appId, canLinkAssetId) {
			const asset = {
				ns: `${nameSpace}.${typeName}`,
				link: appId,
				name: typeName
			}
	
			const metadata = {
				can_link: canLinkAssetId
			}

			return this.createNewAsset(this.vaahanam.appadmin, asset, metadata)
		},
		createNewAsset(keypair, asset, metadata) {
			console.log('Creating new asset : ',asset)
			
			//document.getElementById('update').value += '\nCreating new asset : ' + asset
			
			const API_PATH = 'https://test.bigchaindb.com/api/v1/'
			let conn = new BigchainDB.Connection(API_PATH)

			let condition = BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey, true)

			let output = BigchainDB.Transaction.makeOutput(condition)
			output.public_keys = [keypair.publicKey]

			const transaction = BigchainDB.Transaction.makeCreateTransaction(
				asset,
				metadata,
				[ BigchainDB.Transaction.makeOutput(
					   BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey))
			   ],
				keypair.publicKey
			)

			const txSigned = BigchainDB.Transaction.signTransaction(transaction, keypair.privateKey) 
			
			console.log('New Asset Creation with Transaction Signed ',txSigned)
			
			conn.postTransactionCommit(txSigned)
			
			return txSigned
		},
		
		transferAsset(tx, fromKeyPair, toPublicKey, metadata) {
			
			const API_PATH = 'https://test.bigchaindb.com/api/v1/'
			let conn = new BigchainDB.Connection(API_PATH)

			let condition = BigchainDB.Transaction.makeEd25519Condition(toPublicKey)

			let output = BigchainDB.Transaction.makeOutput(condition)
			output.public_keys = [toPublicKey]

			const txTransfer = BigchainDB.Transaction.makeTransferTransaction(
				[{tx: tx,output_index:0}],
				[output],
				metadata
			)

			const txSigned = BigchainDB.Transaction.signTransaction(txTransfer, fromKeyPair.privateKey)
			return conn.postTransactionCommit(txSigned)
		}

/**
     * Creates Naanayam Tokens for the Vaahan-namchain
     * @param {int} nTokens - Number of tokens to be created [Value is defined as 44 Million].
     * @returns {*} The transaction ID.
     */
createTokens(nTokens) {
		console.log('Request to create Tokens '+nTokens)
	
    	const API_PATH = 'https://test.bigchaindb.com/api/v1/'
    
    	console.log('Public key of Token Creator : ', this.tokenCreatorP)
    
    	let conn = new BigchainDB.Connection(API_PATH)
    	
    	// Construct a transaction payload
    	const tx = BigchainDB.Transaction.makeCreateTransaction({
    			token: 'Naanayam',
    			link: '2a89589da371d3593d7e1a9fed0c888c794a546f933c6a30aaed2adc5f6511dc',
    			number_tokens: nTokens
    		},
    		// Metadata field, contains information about the transaction itself
    		// (can be `null` if not needed)
    		{
    			can_link: '688f4fec05cf6d01624b3a33a7a2206479be8c5a1a1ef50131418b5b6de91d04',
    			datetime: new Date().toString()
    		},
    		// Output: Divisible asset, include nTokens as parameter
    		[BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(this.tokenCreatorP), nTokens.toString())],
    		this.tokenCreatorP
    	)
    	
    	console.log(tx)
    
    	// Sign the transaction with the private key of the token creator
    	const txSigned = BigchainDB.Transaction
    	  .signTransaction(tx, this.tokenCreatorpr)
    	  
    	console.log(txSigned)
    	
        // Send the transaction off to BigchainDB
    	conn.postTransactionCommit(txSigned)
    		.then(res => {
    			//document.getElementById("transid").innerHTML = txSigned.id
    			const elem = document.getElementById('transid')
                elem.href = API_PATH + 'transactions/' + txSigned.id
                elem.innerHTML = txSigned.id
    			})	
    
    	return txSigned.id;
	}

/**
     * Transfer tokens between two users
     * @param {int} amountToSend - number of tokens to be transferred
     * @param {string} receiveraddr - public address of the receiver
     * @returns {*} The transaction ID.
     */
    transfer(amountToSend, receiveraddr) {
                
                const API_PATH = 'https://test.bigchaindb.com/api/v1/'

				let conn = new BigchainDB.Connection(API_PATH)
				
                conn.getTransaction(UserPublickey, false)
				.then((txOutputs) => { 		
					console.log(txOutputs)
					
					let tokens = parseInt(txOutputs['outputs'][0]['amount'])
					
					console.log('Remaining Tokens',tokens)
					
					// Create transfer transaction
					const transferTrans = BigchainDB.Transaction.makeTransferTransaction(
							[{
								tx: txOutputs,
								output_index: 0
							}],
							// Transaction output: Two outputs, because the whole input
							// must be spent
							[BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition('AbLkgEyeUL2xC2QmnEs21cqHjGJuPcPMXA562996QnCw'),(tokens - amountToSend).toString()),
							 BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition('5dzYagqoqjqr9dWa44XYUpTcfvRrH6tFT9Bw4EvTiHC4'),amountToSend.toString())
							],
							// Metadata (optional)
							{
								transfered_to: '5dzYagqoqjqr9dWa44XYUpTcfvRrH6tFT9Bw4EvTiHC4',
								amountreceived: amountToSend
							}
						)
						
					// Sign the transaction with the tokenCreator key
					const signedTransfer = BigchainDB.Transaction.signTransaction(transferTrans, Userprivatekey)
					
					return conn.postTransactionCommit(signedTransfer) 
					})
				.then((tx) =>{
					console.log('Response from BDB server:', tx)
					console.log('Is Ramaguru the owner?', tx['outputs'][1]['public_keys'][0] == '5dzYagqoqjqr9dWa44XYUpTcfvRrH6tFT9Bw4EvTiHC4')
					const elem = document.getElementById('lastTransaction')
                    elem.href = API_PATH + 'transactions/' + tx.id
                    elem.innerText = txSigned.id
                    console.log('Transaction ID : ', tx.id, ' is accepted')				})
                    
        return tx.id
		}

 /**
     * Registers the vehicle, the vehicle owner and creates a relationship between these two assets
     * @param {string} pub - public key of the vehicle owner
     * @param {string} aadhar - aadhar number of the vehicle owner
     * @param {string} engno - Engine number of the vehicle
     * @param {string} chasisno - Chasis number of the vehicle
     * @param {string} vmodel - Vehicle Model
     * @param {string} vservice - Vehicle Service Provider
     * @param {string} vtype - Vehicle Type
     * @param {string} regno - Registration Number
     */
registervehicle1(pub,rto,aadhar,engno,chasisno,vmodel,vservice,vtype,regno){
			
			typeName = 'vehicle'
			typeId = '66b8a260073a94a2bb9b3e6a419e0f36b6967dcaa492640a8893652af6c713aa'
			
			const asset = {
			ns: `${nameSpace}.${typeName}`,
			link: typeId,
			Regional_Transport_Office : rto,
			Engine_number: engno,
			Chasis_number: chasisno,
			Vehicle_model: vmodel,
			Vehicle_type: vtype,
			Vehicle_service: vservice,
			Registration_number: regno,
			Time_of_Registration: new Date().toString(),
			}
			
			const userMetadata = {
				event: 'User Assigned',
				date: new Date(),
				timestamp: Date.now(),
				publicKey: this.vaahanam.raPublicKey,
				eventData: {
					userType: aadhar
				}
			}
			
			const userid = (this.createUser(this.vaahanam.ra, '6bfa6e454a81f6fbc189fe7edc4e79102c791e128fd2fc643d82a18cde4425be', 'user' , pub, userMetadata)).id
			const tx = (this.createTypeInstance(this.vaahanam.ra, asset, { event: 'Vehicle Created', owner: userid })).id;
			
			console.log(tx)
			document.getElementById('transid').value = tx;
		}

 /**
     * Querying blockchain to get the vehicle details based on transaction ID
     * @param {string} tid - Transaction ID
     */
getvehicleTID(tid){
			const API_PATH = 'https://test.bigchaindb.com/api/v1/'
			let conn = new BigchainDB.Connection(API_PATH)
			
			conn.getTransaction(tid)
			.then((res) => {
			console.log('Found Transaction with TID ', tid, ' and content ', res);
			console.log(res['asset']['data']['Regional_Transport_Office']);
			console.log(res['asset']['data']['Engine_number']);
			console.log(res['asset']['data']['Chasis_number']);
			console.log(res['asset']['data']['Vehicle_model']);
			console.log(res['asset']['data']['Vehicle_type']);
			console.log(res['asset']['data']['Vehicle_service']);
			console.log(res['asset']['data']['Time_of_Registration']);
			document.getElementById("rtodet").innerHTML = res['asset']['data']['Regional_Transport_Office'];
			document.getElementById("engnodet").innerHTML = res['asset']['data']['Engine_number'];
			document.getElementById("cnodet").innerHTML = res['asset']['data']['Chasis_number'];
			document.getElementById("vmoddet").innerHTML = res['asset']['data']['Vehicle_model'];
			document.getElementById("vtypedet").innerHTML = res['asset']['data']['Vehicle_type'];
			document.getElementById("vssdet").innerHTML = res['asset']['data']['Vehicle_service'];
			document.getElementById("timedet").innerHTML = res['asset']['data']['Time_of_Registration'];
			})
		}

 /**
     * Invoked by smartcontract to send the critical DTC and corresponding log hash to blockchain
     * @param {string} assetid - Vehicle assetid
     * @param {string} ipfshash - IPFS hash of the log file stored
     * @param {string} smartcontract - IPFS hash of the smartcontract that invoked this
     * @param {string} dtc - Diagnostic trouble code set in the vehicle
     */
senddtc(assetid, ipfshash, smartcontract, dtc){
			//Invoked by  Smart Contracts
			console.log('invoked smart contract for assetid ', assetid, 'ipfshash ', ipfshash,' with dtc set to ', dtc)
			
			const API_PATH = 'https://test.bigchaindb.com/api/v1/'
			let conn = new BigchainDB.Connection(API_PATH)
			
			conn.getTransaction(assetid)
			.then((res) => {
				console.log(res);
				assetidofuser = res['metadata']['owner'];
				console.log(assetidofuser);
				
				conn.getTransaction(assetidofuser)
				.then((txuser) => {
					
					pub = txuser['metadata']['publicKey'];
					
					console.log('Public key of Token Creator : ', pub)
		
					// Construct a transaction payload
					const tx = BigchainDB.Transaction.makeCreateTransaction({
							vehicle: assetid,
							dtc : dtc
							log_hash: ipfshash,
							smartcontract_hash: smartcontract
						},
						// Metadata field, contains information about the transaction itself
						// (can be `null` if not needed)
						{
							datetime: new Date().toString()
						},
						// Output: Divisible asset, include nTokens as parameter
						[BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(pub))],
						pub
					)
					
					console.log(tx)

					// Sign the transaction with the private key of the token creator
					const txSigned = BigchainDB.Transaction.signTransaction(tx, pub)
					
					console.log(txSigned)
					
					conn.postTransactionCommit(txSigned)
					  
					console.log(txSigned.id)
				})
			})
		}		