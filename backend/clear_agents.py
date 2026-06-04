from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

engine = create_engine('sqlite:///office.db')
Session = sessionmaker(bind=engine)
session = Session()
session.query(models.Agent).delete()
session.commit()
print('Agents cleared')
